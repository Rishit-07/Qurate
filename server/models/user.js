import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Concept: Schema Modeling (Mongo / Mongoose)
 * 
 * Demonstrates:
 * 1. Field-level validators (email format regex, length constraints, enums)
 * 2. Nested Subdocument Schemas (contributionsSchema)
 * 3. Compound and unique single-field indexing for query performance
 * 4. Virtual attributes with getters (totalContributions, mergedContributionsCount)
 * 5. Instance methods (comparePassword, toSafeJSON)
 * 6. Static model methods (findByEmailOrUsername, findTopContributors)
 * 7. Mongoose Pre-save Lifecycle Hooks
 */

const contributionSubSchema = new mongoose.Schema(
    {
        issueId: {
            type: String,
            required: [true, "Issue ID is required for contribution tracking"],
            trim: true,
        },
        repoName: {
            type: String,
            trim: true,
            default: "",
        },
        issueTitle: {
            type: String,
            trim: true,
            default: "",
        },
        pullRequestUrl: {
            type: String,
            trim: true,
            default: "",
        },
        status: {
            type: String,
            enum: {
                values: ["planned", "submitted", "merged"],
                message: "{VALUE} is not a supported contribution status",
            },
            default: "planned",
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            trim: true,
            minlength: [2, "Username must be at least 2 characters"],
            maxlength: [50, "Username cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email address is required"],
            unique: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (val) {
                    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val);
                },
                message: (props) => `${props.value} is not a valid email address!`,
            },
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
        },
        stack: [
            {
                type: String,
                lowercase: true,
                trim: true,
            },
        ],
        experienceLevel: {
            type: String,
            enum: {
                values: ["beginner", "intermediate", "advanced"],
                message: "{VALUE} is not a valid experience level",
            },
            default: "beginner",
        },
        githubUsername: {
            type: String,
            trim: true,
            default: "",
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        avatar: {
            type: String,
            default: "",
        },
        bookmarks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Issue",
            },
        ],
        contributions: [contributionSubSchema],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for query performance
userSchema.index({ email: 1 });
userSchema.index({ githubUsername: 1 });
userSchema.index({ role: 1 });

// Virtual Properties
userSchema.virtual("totalContributions").get(function () {
    return this.contributions ? this.contributions.length : 0;
});

userSchema.virtual("mergedContributionsCount").get(function () {
    if (!this.contributions) return 0;
    return this.contributions.filter((c) => c.status === "merged").length;
});

userSchema.virtual("plannedContributionsCount").get(function () {
    if (!this.contributions) return 0;
    return this.contributions.filter((c) => c.status === "planned").length;
});

// Instance Method: Compare password safely with bcrypt
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance Method: Convert to sanitized JSON (strips sensitive password field)
userSchema.methods.toSafeJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

// Instance Method: Check if issue is already bookmarked
userSchema.methods.isBookmarked = function (issueObjectId) {
    if (!this.bookmarks) return false;
    return this.bookmarks.some((b) => b.toString() === issueObjectId.toString());
};

// Static Method: Find user by email or username (case-insensitive)
userSchema.statics.findByEmailOrUsername = function (identifier) {
    const clean = (identifier || "").trim();
    return this.findOne({
        $or: [
            { email: clean.toLowerCase() },
            { username: { $regex: new RegExp(`^${clean}$`, "i") } },
        ],
    });
};

// Static Method: Retrieve top contributors by merged PR count
userSchema.statics.findTopContributors = function (limit = 10) {
    return this.aggregate([
        { $unwind: { path: "$contributions", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: "$_id",
                username: { $first: "$username" },
                avatar: { $first: "$avatar" },
                githubUsername: { $first: "$githubUsername" },
                mergedCount: {
                    $sum: { $cond: [{ $eq: ["$contributions.status", "merged"] }, 1, 0] },
                },
            },
        },
        { $sort: { mergedCount: -1 } },
        { $limit: limit },
    ]);
};

// Pre-save lifecycle hook
userSchema.pre("save", async function () {
    if (this.isModified("email") && this.email) {
        this.email = this.email.toLowerCase().trim();
    }
});

const User = mongoose.model("User", userSchema);
export default User;
