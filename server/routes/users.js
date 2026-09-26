import express from "express";
import axios from "axios";
import protect from "../middleware/auth.js";
import User from "../models/user.js";
import Issue from "../models/issue.js";
import bcrypt from "bcryptjs";
import { calculateStackDna } from "../services/stackDnaService.js";

const router = express.Router();

// Get Stack DNA Radar metrics and archetype for authenticated user
router.get("/stack-dna", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("bookmarks")
            .select("username stack experienceLevel bookmarks contributions");
        if (!user) return res.status(404).json({ error: "User not found" });

        const stackDna = calculateStackDna(user);
        return res.json({ success: true, stackDna });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get fresh user profile for authenticated user
router.get("/profile", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get public developer passport by username (Unprotected - for shareable public profile links)
router.get("/public/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") })
            .select("username avatar role experienceLevel stack githubUsername contributions createdAt")
            .populate("bookmarks");

        if (!user) return res.status(404).json({ error: "Developer profile not found" });

        const stackDna = calculateStackDna(user);

        // Filter contributions: only show PR created and merged works for public portfolio
        const publicContributions = (user.contributions || []).filter(c => 
            c.status === "merged" || c.status === "completed" || c.status === "pr_created" || c.status === "submitted"
        );

        return res.json({
            success: true,
            user: {
                username: user.username,
                avatar: user.avatar,
                role: user.role,
                experienceLevel: user.experienceLevel,
                stack: user.stack || [],
                githubUsername: user.githubUsername,
                createdAt: user.createdAt,
                contributions: publicContributions,
                stackDna,
            }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get contribution log for authenticated user
router.get("/contributions", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("contributions");
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.json({ contributions: user.contributions || [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

function normalizeContributionPayload(body) {
    const {
        issueId,
        repoName,
        issueTitle,
        issueUrl,
        branchName,
        pullRequestUrl,
        prNumber,
        notes,
        status,
    } = body;

    return {
        issueId: issueId ? String(issueId) : undefined,
        repoName: repoName || "",
        issueTitle: issueTitle || "",
        issueUrl: issueUrl || "",
        branchName: branchName || "",
        pullRequestUrl: pullRequestUrl || "",
        prNumber: prNumber ? Number(prNumber) : undefined,
        notes: notes || "",
        status: status || "planned",
        updatedAt: new Date(),
    };
}

// Create or update a contribution status for an issue
router.post("/contributions", protect, async (req, res) => {
    try {
        const contribution = normalizeContributionPayload(req.body);

        if (!contribution.issueId || !contribution.status) {
            return res.status(400).json({ error: "issueId and status are required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const existingIndex = (user.contributions || []).findIndex(
            item => String(item.issueId) === contribution.issueId
        );

        if (existingIndex >= 0) {
            user.contributions[existingIndex] = {
                ...user.contributions[existingIndex].toObject?.() || user.contributions[existingIndex],
                ...contribution,
                updatedAt: new Date(),
            };
        } else {
            user.contributions.push(contribution);
        }

        await user.save();

        return res.json({ contributions: user.contributions });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Update an existing contribution status and metadata (branch, PR URL, notes)
router.patch("/contributions/:issueId", protect, async (req, res) => {
    try {
        const { issueId } = req.params;
        const { status, branchName, pullRequestUrl, prNumber, notes, issueTitle, repoName, issueUrl } = req.body;

        if (!issueId) {
            return res.status(400).json({ error: "issueId is required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        let contribution = user.contributions.find(
            item => String(item.issueId) === String(issueId)
        );

        if (!contribution) {
            // If doesn't exist yet, auto-create it
            const newCont = normalizeContributionPayload({
                issueId,
                status: status || "planned",
                branchName,
                pullRequestUrl,
                prNumber,
                notes,
                issueTitle,
                repoName,
                issueUrl,
            });
            user.contributions.push(newCont);
            contribution = user.contributions[user.contributions.length - 1];
        } else {
            if (status) contribution.status = status;
            if (branchName !== undefined) contribution.branchName = branchName;
            if (pullRequestUrl !== undefined) contribution.pullRequestUrl = pullRequestUrl;
            if (prNumber !== undefined) contribution.prNumber = prNumber;
            if (notes !== undefined) contribution.notes = notes;
            if (issueTitle !== undefined) contribution.issueTitle = issueTitle;
            if (repoName !== undefined) contribution.repoName = repoName;
            if (issueUrl !== undefined) contribution.issueUrl = issueUrl;
            contribution.updatedAt = new Date();
        }

        await user.save();

        return res.json({ contributions: user.contributions });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Sync pull request status from GitHub for a contribution
router.post("/contributions/sync-pr/:issueId", protect, async (req, res) => {
    try {
        const { issueId } = req.params;
        const inputPrUrl = req.body.pullRequestUrl;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const contribution = user.contributions.find(
            item => String(item.issueId) === String(issueId)
        );

        if (!contribution && !inputPrUrl) {
            return res.status(404).json({ error: "Contribution not found and no PR URL provided" });
        }

        const prUrlToInspect = inputPrUrl || contribution?.pullRequestUrl;
        if (!prUrlToInspect) {
            return res.status(400).json({ error: "No pull request URL available to verify" });
        }

        // Regex parse: https://github.com/:owner/:repo/pull/:prNumber
        const prMatch = prUrlToInspect.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
        if (!prMatch) {
            return res.status(400).json({ error: "Invalid GitHub pull request URL format. Expected: https://github.com/:owner/:repo/pull/:number" });
        }

        const [, owner, repo, prNumberStr] = prMatch;
        const prNumber = parseInt(prNumberStr, 10);

        // Fetch live PR status from GitHub REST API
        const ghHeaders = {
            "User-Agent": "Qurate-Platform/1.0",
            Accept: "application/vnd.github.v3+json",
        };
        if (process.env.GITHUB_TOKEN) {
            ghHeaders.Authorization = `token ${process.env.GITHUB_TOKEN}`;
        }

        const ghRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
            headers: ghHeaders,
            validateStatus: status => status < 500,
        });

        if (ghRes.status === 404) {
            return res.status(404).json({ error: "Pull request not found on GitHub" });
        }

        const prData = ghRes.data;
        const isMerged = Boolean(prData.merged || prData.merged_at);
        const isOpen = prData.state === "open";
        const newStatus = isMerged ? "merged" : (isOpen ? "pr_created" : "submitted");
        const branchName = prData.head?.ref || "";

        if (contribution) {
            contribution.pullRequestUrl = prData.html_url || prUrlToInspect;
            contribution.prNumber = prNumber;
            contribution.status = newStatus;
            if (branchName && !contribution.branchName) {
                contribution.branchName = branchName;
            }
            contribution.updatedAt = new Date();
        } else {
            user.contributions.push({
                issueId: String(issueId),
                repoName: `${owner}/${repo}`,
                issueTitle: prData.title || "Contribution",
                pullRequestUrl: prData.html_url || prUrlToInspect,
                prNumber,
                branchName,
                status: newStatus,
                updatedAt: new Date(),
            });
        }

        await user.save();

        return res.json({
            success: true,
            status: newStatus,
            isMerged,
            isOpen,
            branchName,
            prNumber,
            title: prData.title,
            contributions: user.contributions,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Remove a contribution record when a bookmark is removed
router.delete("/contributions/:issueId", protect, async (req, res) => {
    try {
        const { issueId } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.contributions = (user.contributions || []).filter(
            item => String(item.issueId) !== String(issueId)
        );

        await user.save();

        return res.json({ contributions: user.contributions });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Update profile for authenticated user (allows changing email and password)
router.put("/profile", protect, async (req, res) => {
    try {
        const { username, githubUsername, stack, experienceLevel, email, password } = req.body;
        const updates = {};
        if (username !== undefined) updates.username = username;
        if (githubUsername !== undefined) updates.githubUsername = githubUsername;
        if (stack !== undefined) updates.stack = stack;
        if (experienceLevel !== undefined) updates.experienceLevel = experienceLevel;

        // Handle email change (ensure uniqueness)
        if (email !== undefined) {
            const existing = await User.findOne({ email });
            if (existing && String(existing._id) !== String(req.user.id)) {
                return res.status(400).json({ error: 'Email already in use' });
            }
            updates.email = email;
        }

        // Handle password change (hash before saving)
        if (password !== undefined && password) {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);
            updates.password = hashed;
        }

        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("username email stack experienceLevel githubUsername");
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.json({ user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
