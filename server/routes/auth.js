import express from "express";
import {
    login,
    register,
    resetPassword,
    changeEmail,
    githubOAuthLogin,
} from "../controllers/authController.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { sanitizeInput } from "../middleware/sanitize.js";
import { uploadAvatar } from "../middleware/upload.js";
import protect from "../middleware/auth.js";
import User from "../models/user.js";

const router = express.Router();

// Apply input sanitization and rate limiting to authentication routes
router.use(sanitizeInput);

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/github", authRateLimiter, githubOAuthLogin);
router.post("/reset-password", authRateLimiter, resetPassword);
router.post("/change-email", authRateLimiter, changeEmail);

// Avatar file upload endpoint
router.post("/avatar", protect, uploadAvatar.single("avatar"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Please select an image file to upload." });
        }

        const avatarUrl = `/uploads/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatar: avatarUrl },
            { new: true }
        ).select("-password");

        return res.status(200).json({
            message: "Avatar uploaded successfully",
            avatarUrl,
            user,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;