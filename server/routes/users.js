import express from "express";
import protect from "../middleware/auth.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";

const router = express.Router();

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
        pullRequestUrl,
        status,
    } = body;

    return {
        issueId: issueId ? String(issueId) : undefined,
        repoName,
        issueTitle,
        pullRequestUrl,
        status,
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

// Update an existing contribution status
router.patch("/contributions/:issueId", protect, async (req, res) => {
    try {
        const { issueId } = req.params;
        const { status } = req.body;

        if (!issueId || !status) {
            return res.status(400).json({ error: "issueId and status are required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const contribution = user.contributions.find(
            item => String(item.issueId) === String(issueId)
        );

        if (!contribution) {
            return res.status(404).json({ error: "Contribution not found" });
        }

        contribution.status = status;
        await user.save();

        return res.json({ contributions: user.contributions });
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
