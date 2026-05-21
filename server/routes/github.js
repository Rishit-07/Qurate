import express from "express";
import { getGithubContributions } from "../controllers/githubController.js";
import { getGithubActivity } from "../controllers/githubController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// GET /api/github/contributions/:username
// Protected — user must be logged in
router.get("/contributions/:username", protect, getGithubContributions);
router.get("/activity/:username", protect, getGithubActivity);

export default router;