import mongoose from "mongoose";

/**
 * Concept: Schema Modeling (Mongo / Mongoose)
 * Subdocument schema with strict bounds validation and indexing.
 */
const fitScoreSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "userId is required for fit score tracking"],
            index: true,
        },
        score: {
            type: Number,
            required: [true, "Fit score is required"],
            min: [1, "Fit score cannot be less than 1"],
            max: [10, "Fit score cannot exceed 10"],
        },
        reason: {
            type: String,
            required: [true, "Explanation reason is required"],
            trim: true,
            maxlength: [500, "Reason cannot exceed 500 characters"],
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        scoredAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

export default fitScoreSchema;
