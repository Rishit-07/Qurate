import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import issueRoutes from "./routes/issues.js";
import githubRoutes from "./routes/github.js";
import usersRoutes from "./routes/users.js";
import { startIssueSyncScheduler } from "./services/issueSyncScheduler.js";

dotenv.config();
await connectDB();

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",                        // local dev
        "http://localhost:3000",                        // fallback local
        process.env.FRONTEND_URL,                      // set this on Render
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running");
});

app.use("/api/auth",   authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/users",  usersRoutes);

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startIssueSyncScheduler();
});