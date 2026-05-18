import mongoose from "mongoose";
import fitScoreSchema from "./fitScoreSchema.js";

const issueSchema = new mongoose.Schema({
    github_id: {
        type: Number,
    },
    title: String,
    body: String,
    html_url: String,
    repo: {
        name: String,
        stars: Number,
        language: String
    },
    labels: [
        {
            type: String
        }
    ],
    stacks: [
        {
            type: String
        }
    ],
    complexity: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner"
    },
    synced_at: { type: Date, default: Date.now },
    fitScores: [fitScoreSchema],
},
    {
        timestamps: true
    }
);

issueSchema.index({ stacks: 1, complexity: 1 });
const Issue = mongoose.model("Issue", issueSchema);
export default Issue;
