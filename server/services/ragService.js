import { GoogleGenerativeAI } from "@google/generative-ai";
import Issue from "../models/issue.js";

// Cosine similarity between two numerical vectors
export const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Global domain vocabulary for deterministic semantic embeddings
const DOMAIN_VOCAB = [
    "react", "vue", "angular", "svelte", "javascript", "typescript", "frontend", "ui", "component",
    "jsx", "tsx", "state", "hook", "css", "html", "tailwind", "button", "layout", "browser", "dom",
    "node", "express", "backend", "api", "rest", "graphql", "server", "http", "route", "endpoint",
    "python", "django", "flask", "fastapi", "pandas", "numpy", "ai", "machine", "learning", "model",
    "rust", "cargo", "memory", "unsafe", "borrow", "concurrency", "thread", "pointer", "lowlevel",
    "database", "sql", "postgres", "mongodb", "schema", "query", "nosql", "redis", "cache",
    "docker", "kubernetes", "devops", "ci", "cd", "test", "jest", "lint", "bug", "fix", "issue"
];

/**
 * Deterministic Semantic Embedding Vectorizer
 * Generates normalized vocabulary-based semantic vectors
 * or utilizes Gemini embedding-001 / text-embedding-004 when available.
 */
export const generateEmbedding = async (text) => {
    if (!text) return new Array(DOMAIN_VOCAB.length).fill(0);

    if (process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
            const result = await embeddingModel.embedContent(text.slice(0, 1000));
            if (result.embedding?.values && result.embedding.values.length > 0) {
                return result.embedding.values;
            }
        } catch (err) {
            // Fallback to domain vocabulary TF vectorizer
        }
    }

    // Normalized Term-Frequency vector over domain vocabulary
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const words = clean.split(/\s+/).filter(Boolean);
    const vector = new Array(DOMAIN_VOCAB.length).fill(0);

    for (let i = 0; i < DOMAIN_VOCAB.length; i++) {
        const term = DOMAIN_VOCAB[i];
        for (const w of words) {
            if (w === term || w.includes(term) || term.includes(w)) {
                vector[i] += 1;
            }
        }
    }

    // L2 Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
};

/**
 * RAG Vector Retrieval Engine:
 * Retrieves the top K semantically most relevant issues from MongoDB
 * matching the user's natural language query or developer profile embeddings.
 */
export const retrieveSemanticIssues = async ({ query, user, topK = 6 }) => {
    const queryContext = `Developer Skills: ${(user?.stack || []).join(", ")}. Experience: ${user?.experienceLevel || "beginner"}. Query: ${query || "good first issue"}`;
    
    // 1. Generate query embedding
    const queryVector = await generateEmbedding(queryContext);

    // 2. Fetch issue candidate pool from MongoDB
    const issues = await Issue.find({}).limit(50).lean();

    if (issues.length === 0) {
        return [];
    }

    // 3. Compute vector similarities across issue pool
    const scoredIssues = await Promise.all(
        issues.map(async (issue) => {
            const issueContext = `${issue.title} ${issue.complexity} ${(issue.labels || []).join(" ")} ${(issue.stacks || []).join(" ")} ${(issue.body || "").slice(0, 200)}`;
            const issueVector = await generateEmbedding(issueContext);
            const similarity = cosineSimilarity(queryVector, issueVector);
            return {
                ...issue,
                vectorSimilarity: Number(similarity.toFixed(4)),
                retrievalScore: Math.round(similarity * 100),
            };
        })
    );

    // 4. Rank and return topK most semantically aligned issues
    return scoredIssues
        .sort((a, b) => b.vectorSimilarity - a.vectorSimilarity)
        .slice(0, topK);
};
