import express from "express";
import protect from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";
import User from "../models/user.js";
import Issue from "../models/issue.js";

const router = express.Router();

/**
 * Admin Protected Routes — Requires valid JWT and 'admin' role
 */

// 1. Admin System Metrics
router.get("/metrics", protect, authorize("admin"), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalIssues = await Issue.countDocuments();
        const adminUsers = await User.countDocuments({ role: "admin" });

        return res.status(200).json({
            status: "success",
            authorizedRole: req.userRole,
            metrics: {
                totalUsers,
                adminUsers,
                totalIssues,
                systemHealth: "Optimal",
                serverUptimeSeconds: Math.floor(process.uptime()),
            },
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// 2. Admin: Promote user role
router.post("/promote-user", protect, authorize("admin"), async (req, res) => {
    try {
        const { targetUserId, role } = req.body;
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ error: "Invalid role specified." });
        }

        const user = await User.findByIdAndUpdate(
            targetUserId,
            { role },
            { new: true }
        ).select("username email role");

        if (!user) {
            return res.status(404).json({ error: "Target user not found." });
        }

        return res.status(200).json({
            message: `User ${user.username} role updated to ${role} successfully.`,
            user,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
