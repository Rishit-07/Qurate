import { fetchGithubIssues, searchGithubIssues } from "../services/githubServices.js";
import { scoreIssueForUser } from "../services/aiScoringService.js";
import User from "../models/user.js";
import Issue from "../models/issue.js";
import mongoose from "mongoose";

export const syncIssuesToDatabase = async () => {
    const issues = await fetchGithubIssues();

    for (const issue of issues) {
        const { stacks, labels, ...issueFields } = issue;

        await Issue.findOneAndUpdate(
            { github_id: issue.github_id },
            {
                $set: {
                    ...issueFields,
                    synced_at: new Date(),
                },
                $addToSet: {
                    stacks: { $each: stacks },
                    labels: { $each: labels },
                },
            },
            { upsert: true, new: true }
        );
    }

    return issues.length;
};

export const syncIssues = async (req, res) => {
    try {
        const syncedCount = await syncIssuesToDatabase();

        return res.status(200).json({
            message: `Synced ${syncedCount} issues successfully`,
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
};

export const getIssues = async (req, res) => {
    try {
        const { stack, complexity, page = 1, limit = 10, userStack, userLevel } = req.query;
        const filter = {};

        // Accurate tech stack filtering: checks both issue.stacks array and issue.repo.language
        if (stack && stack.toLowerCase() !== 'all') {
            const rawStackItems = stack.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
            const regexList = rawStackItems.map(s => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i"));
            filter.$or = [
                { stacks: { $in: regexList } },
                { "repo.language": { $in: regexList } },
            ];
        }

        // Accurate complexity / level filtering
        if (complexity && complexity.toLowerCase() !== 'all') {
            filter.complexity = complexity.trim().toLowerCase();
        }

        const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 50);
        const pageNum = Math.max(Number(page) || 1, 1);
        const skipNum = (pageNum - 1) * limitNum;

        const total = await Issue.countDocuments(filter);

        const userStacks = userStack ? userStack.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : [];
        const userLevelNorm = userLevel ? userLevel.trim().toLowerCase() : "";

        let issues;

        // If user profile preferences (stack or experience level) are provided and we're on "All" or open browse,
        // rank and sort matching issues to the top of the feed!
        if (userStacks.length > 0 || userLevelNorm) {
            const pipeline = [
                { $match: filter },
                {
                    $addFields: {
                        stackMatchScore: {
                            $cond: [
                                {
                                    $or: [
                                        { $gt: [{ $size: { $setIntersection: [{ $ifNull: ["$stacks", []] }, userStacks] } }, 0] },
                                        { $in: [{ $toLower: { $ifNull: ["$repo.language", ""] } }, userStacks] }
                                    ]
                                },
                                10,
                                0
                            ]
                        },
                        levelMatchScore: {
                            $cond: [
                                { $eq: ["$complexity", userLevelNorm] },
                                5,
                                0
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        stackMatchScore: -1,
                        levelMatchScore: -1,
                        synced_at: -1,
                        _id: -1
                    }
                },
                { $skip: skipNum },
                { $limit: limitNum }
            ];

            issues = await Issue.aggregate(pipeline);
        } else {
            issues = await Issue.find(filter)
                .sort({ synced_at: -1, _id: -1 })
                .skip(skipNum)
                .limit(limitNum)
                .lean();
        }

        return res.status(200).json({
            issues,
            total,
            page: pageNum,
            hasMore: pageNum * limitNum < total,
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

export const searchIssues = async (req, res) => {
    try {
        const query = req.query.q?.trim();

        if (!query) {
            return res.status(400).json({
                error: "Search query is required"
            });
        }

        let issues = [];
        let isRateLimited = false;

        try {
            issues = await searchGithubIssues(query);
        } catch (apiErr) {
            console.warn("GitHub live search failed:", apiErr.message);
            isRateLimited = true;
        }

        const savedIssues = [];

        if (issues && issues.length > 0) {
            for (const issue of issues) {
                const { stacks, labels, ...issueFields } = issue;
                const savedIssue = await Issue.findOneAndUpdate(
                    { github_id: issue.github_id },
                    {
                        $set: {
                            ...issueFields,
                            synced_at: new Date(),
                        },
                        $addToSet: {
                            stacks: { $each: stacks || [] },
                            labels: { $each: labels || [] },
                        },
                    },
                    { upsert: true, new: true }
                );

                savedIssues.push(savedIssue);
            }
        }

        // If GitHub returned and synced live issues, return them
        if (savedIssues.length > 0) {
            return res.status(200).json({
                issues: savedIssues,
                total: savedIssues.length,
                query,
            });
        }

        // Fallback: If GitHub API was rate-limited (HTTP 403) or returned 0 results,
        // search the 2,600+ curated issues in our MongoDB database!
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        const localMatches = await Issue.find({
            $or: [
                { title: regex },
                { body: regex },
                { stacks: regex },
                { labels: regex },
                { complexity: regex },
                { "repo.name": regex },
                { "repo.language": regex },
            ]
        }).limit(20).lean();

        return res.status(200).json({
            issues: localMatches,
            total: localMatches.length,
            query,
            fallback: true,
            notice: isRateLimited ? "GitHub API rate limit reached. Displaying matching issues from database." : null
        });
    } catch (err) {
        console.error("searchIssues error:", err);
        // Guarantee graceful recovery even under unexpected errors
        try {
            const query = req.query.q?.trim() || "";
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'i');
            const fallbackIssues = await Issue.find({
                $or: [{ title: regex }, { stacks: regex }, { complexity: regex }]
            }).limit(15).lean();
            return res.status(200).json({
                issues: fallbackIssues,
                total: fallbackIssues.length,
                query,
                fallback: true
            });
        } catch (dbErr) {
            return res.status(500).json({ error: "Failed to search issues" });
        }
    }
};

export const scoreIssue = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ error: "Issue not found" });

        // Fetch full user from DB — JWT only has id and email
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const existing = issue.fitScores.find(
            s => s.userId.toString() === user._id.toString()
        );
        if (existing) return res.json({ ...existing.toObject(), cached: true });

        const result = await scoreIssueForUser(issue, user);

        await Issue.findByIdAndUpdate(req.params.id, {
            $push: {
                fitScores: {
                    userId: user._id,
                    score: result.score,
                    reason: result.reason,
                    scoredAt: new Date(),
                },
            },
        });

        res.json({ ...result, cached: false });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
