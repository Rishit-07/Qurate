import express from "express";
import { getGithubContributions, getGithubActivity, getGithubDayActivity } from "../controllers/githubController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// GET /api/github/contributions/:username
// Protected — user must be logged in
router.get("/contributions/:username", protect, getGithubContributions);
router.get("/public-calendar/:username", getGithubContributions);
router.get("/activity/:username", protect, getGithubActivity);
router.get("/day-activity/:username", protect, getGithubDayActivity);

export default router;