import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import issueRoutes from "./routes/issues.js";
import githubRoutes from "./routes/github.js";
import usersRoutes from "./routes/users.js";
import { startIssueSyncScheduler } from "./services/issueSyncScheduler.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();
await connectDB();

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        // Allow non-browser requests (e.g., curl) with no origin
        if (!origin) return callback(null, true);

        const allowed = [
            "http://localhost:5173",
            "http://localhost:3000",
        ];
        if (process.env.FRONTEND_URL) allowed.push(process.env.FRONTEND_URL);

        // Allow any Vercel preview/production host under *.vercel.app
        if (origin.endsWith('.vercel.app')) return callback(null, true);

        if (allowed.includes(origin)) return callback(null, true);
        return callback(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running");
});

// Health endpoint (safe): reports whether the server sees a JWT secret (does NOT expose the secret)
app.get('/health', (req, res) => {
    const jwtConfigured = !!(process.env.JWT_SECRET || process.env.SECRET_KEY);
    res.json({ ok: true, jwtConfigured });
});

app.use("/api/auth",   authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/users",  usersRoutes);

// Serve client build in production when available so frontend and backend
// can be deployed together from a single server (build into client/dist).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, "../client/dist");
if (process.env.NODE_ENV === "production" && fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get("*", (req, res) => {
        res.sendFile(path.join(clientDistPath, "index.html"));
    });
}

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Log whether a JWT secret is present (do not print the secret)
    const jwtConfigured = !!(process.env.JWT_SECRET || process.env.SECRET_KEY);
    console.log(`JWT secret configured: ${jwtConfigured}`);
    startIssueSyncScheduler();
});