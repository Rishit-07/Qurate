import express from "express";
import { syncIssues } from "../controllers/issueController.js";
import { getIssues } from "../controllers/issueController.js";
import { searchIssues } from "../controllers/issueController.js";
import { scoreIssue } from "../controllers/issueController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

router.get("/sync", syncIssues);
router.get("/search", searchIssues);
router.get("/", getIssues);
router.post("/:id/score", protect, scoreIssue);

export default router;
