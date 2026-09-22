import express from "express";
import protect from "../middleware/auth.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { runContributionAgent } from "../services/aiAgentService.js";
import { retrieveSemanticIssues } from "../services/ragService.js";
import { checkPromptSafety, wrapUntrustedInput } from "../services/promptDefenseService.js";
import User from "../models/user.js";

const router = express.Router();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

/**
 * 1. Streaming Responses: Server-Sent Events (SSE) AI Analysis
 * Streams chunk-by-chunk analysis of an open-source issue for the developer.
 */
router.post("/stream-analysis", protect, aiRateLimiter, async (req, res) => {
    try {
        const { issueTitle, issueBody, stack, experienceLevel } = req.body;

        // Prompt injection defense check
        const promptSafety = checkPromptSafety(`${issueTitle} ${issueBody}`);
        if (!promptSafety.isSafe) {
            console.warn("Safety filter triggered in stream analysis:", promptSafety.flaggedPatterns);
        }

        // Setup SSE Headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        if (!process.env.GEMINI_API_KEY) {
            const fallbackChunks = [
                "### 🔍 Issue Overview & Alignment\n\n",
                `The issue **"${issueTitle || "Selected Issue"}"** aligns well with your declared experience level (${experienceLevel || "beginner"}).\n\n`,
                "### 🛠️ Key Technical Areas\n",
                `- Relevant stack items: ${Array.isArray(stack) ? stack.join(", ") : "JavaScript, React"}\n`,
                "- Suggested PR approach: Start by reproducing the behavior locally with a minimal test case.\n\n",
                "### 🚀 Next Steps\n",
                "1. Clone the repository and branch from `main`.\n",
                "2. Check existing issue discussions for maintainer pointers.\n",
                "3. Submit a clean draft pull request.",
            ];

            for (const chunk of fallbackChunks) {
                res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
                await new Promise(r => setTimeout(r, 120));
            }
            res.write(`data: ${JSON.stringify({ done: true, totalTokens: 85 })}\n\n`);
            return res.end();
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const safeIssue = wrapUntrustedInput(`Title: ${issueTitle}\nBody: ${issueBody}`, "issue_context");
        const safeProfile = wrapUntrustedInput(`Stack: ${Array.isArray(stack) ? stack.join(", ") : stack}\nLevel: ${experienceLevel}`, "dev_profile");

        const prompt = `You are a real-time open-source mentor. Provide a streaming breakdown of how a developer should tackle this issue:
${safeIssue}
${safeProfile}

Format your response in crisp markdown with sections:
1. Architectural Overview & Context
2. Potential Pitfalls to Avoid
3. Step-by-Step Implementation Guide`;

        const streamingResult = await model.generateContentStream(prompt);

        let totalPromptTokens = 0;
        let totalCandidateTokens = 0;

        for await (const chunk of streamingResult.stream) {
            const chunkText = chunk.text();
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        const finalResponse = await streamingResult.response;
        const usage = finalResponse.usageMetadata || {};
        totalPromptTokens = usage.promptTokenCount || 0;
        totalCandidateTokens = usage.candidatesTokenCount || 0;

        res.write(`data: ${JSON.stringify({
            done: true,
            tokenMetrics: {
                promptTokens: totalPromptTokens,
                candidatesTokens: totalCandidateTokens,
                totalTokens: totalPromptTokens + totalCandidateTokens,
            },
        })}\n\n`);

        res.end();
    } catch (err) {
        console.error("Streaming error:", err);
        res.write(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`);
        res.end();
    }
});

/**
 * 2. Multi-Step Agent: Autonomous Tool-Calling Contribution Planner
 */
router.post("/agent-roadmap", protect, aiRateLimiter, async (req, res) => {
    try {
        const { issue } = req.body;
        if (!issue) {
            return res.status(400).json({ error: "Issue payload required." });
        }

        const user = await User.findById(req.user.id).lean();
        const agentOutput = await runContributionAgent({ issue, user });

        return res.status(200).json(agentOutput);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * 3. RAG: Semantic Vector Retrieval over Issues and Developer Profile
 */
router.post("/rag-search", protect, aiRateLimiter, async (req, res) => {
    try {
        const { query, topK = 6 } = req.body;
        const user = await User.findById(req.user.id).lean();

        const semanticMatches = await retrieveSemanticIssues({
            query: query || "",
            user,
            topK: Number(topK) || 6,
        });

        return res.status(200).json({
            retrievalMethod: "RAG Vector Cosine Similarity",
            matchesCount: semanticMatches.length,
            issues: semanticMatches,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * 4. Prompt Injection Defense & Safety Verification Endpoint
 */
router.post("/prompt-safety-check", protect, (req, res) => {
    const { promptText } = req.body;
    const safetyResult = checkPromptSafety(promptText);
    return res.status(200).json({
        checkedText: promptText?.slice(0, 100),
        ...safetyResult,
        status: safetyResult.isSafe ? "CLEAN" : "FLAGGED_INJECTION_RISK",
    });
});

export default router;
