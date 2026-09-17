import mongoose from "mongoose";
import fitScoreSchema from "./fitScoreSchema.js";

/**
 * Concept: Schema Modeling (Mongo / Mongoose)
 * 
 * Issue Schema demonstrates:
 * 1. Text indexing for MongoDB full-text search across titles and descriptions
 * 2. Compound indexing for query optimization on feed filtering ({ stacks: 1, complexity: 1 })
 * 3. Embedded Subdocument arrays with custom schema (fitScoreSchema)
 * 4. Virtual fields computing dynamic aggregate metrics (averageScore, fitScoresCount)
 * 5. Static query helper methods (findRecommended, searchByKeyword)
 * 6. Instance helper methods (getUserFitScore)
 */

const issueSchema = new mongoose.Schema(
    {
        github_id: {
            type: Number,
            required: [true, "GitHub Issue ID is required"],
            unique: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Issue title is required"],
            trim: true,
        },
        body: {
            type: String,
            default: "",
        },
        html_url: {
            type: String,
            required: [true, "GitHub URL is required"],
            trim: true,
        },
        repo: {
            name: { type: String, trim: true, default: "" },
            stars: { type: Number, default: 0, min: 0 },
            language: { type: String, trim: true, default: "" },
            owner: { type: String, trim: true, default: "" },
        },
        labels: [
            {
                type: String,
                trim: true,
            },
        ],
        stacks: [
            {
                type: String,
                lowercase: true,
                trim: true,
            },
        ],
        complexity: {
            type: String,
            enum: {
                values: ["beginner", "intermediate", "advanced"],
                message: "{VALUE} is not a valid complexity level",
            },
            default: "beginner",
            index: true,
        },
        synced_at: {
            type: Date,
            default: Date.now,
            index: true,
        },
        fitScores: [fitScoreSchema],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// 1. Compound Index for Feed Filtering (filtering by developer stack + difficulty)
issueSchema.index({ stacks: 1, complexity: 1 });

// 2. Compound Index for Repository Language & Recency
issueSchema.index({ "repo.language": 1, synced_at: -1 });

// 3. Full-Text Search Index on Issue Title and Description
issueSchema.index(
    { title: "text", body: "text" },
    { weights: { title: 5, body: 1 }, name: "issue_text_index" }
);

// Virtual Property: Calculate average AI fit score across all evaluated users
issueSchema.virtual("averageScore").get(function () {
    if (!this.fitScores || this.fitScores.length === 0) return 0;
    const sum = this.fitScores.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return Number((sum / this.fitScores.length).toFixed(1));
});

// Virtual Property: Total number of generated fit scores
issueSchema.virtual("fitScoresCount").get(function () {
    return this.fitScores ? this.fitScores.length : 0;
});

// Instance Method: Find fit score for a specific user ID
issueSchema.methods.getUserFitScore = function (userId) {
    if (!this.fitScores || !userId) return null;
    return this.fitScores.find(
        (item) => item.userId && item.userId.toString() === userId.toString()
    ) || null;
};

// Static Method: Find issues recommended for a user's declared stack and experience level
issueSchema.statics.findRecommended = function (userStacks = [], experienceLevel = "beginner", limit = 20) {
    const query = { complexity: experienceLevel };
    if (userStacks.length > 0) {
        query.stacks = { $in: userStacks.map((s) => s.toLowerCase()) };
    }
    return this.find(query).sort({ synced_at: -1 }).limit(limit);
};

// Static Method: Perform full-text search with relevance ranking
issueSchema.statics.searchByKeyword = function (keyword, limit = 20) {
    if (!keyword) return this.find().sort({ synced_at: -1 }).limit(limit);
    return this.find(
        { $text: { $search: keyword } },
        { score: { $meta: "textScore" } }
    )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit);
};

const Issue = mongoose.model("Issue", issueSchema);
export default Issue;
