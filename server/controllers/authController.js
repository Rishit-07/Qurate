import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";

const getJwtSecret = () => process.env.JWT_SECRET || process.env.SECRET_KEY || "qurate_dev_secret_jwt_key_2026";

export const register = async (req, res) => {
    try {
        const {
            username,
            password,
            email,
            stack,
            experienceLevel,
            role = "user",
        } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            stack: stack || [],
            experienceLevel: experienceLevel || "beginner",
            role: role === "admin" ? "admin" : "user",
        });

        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            getJwtSecret(),
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                stack: newUser.stack,
                experienceLevel: newUser.experienceLevel,
                role: newUser.role,
                avatar: newUser.avatar,
            },
        });
    } catch (err) {
        return res.status(500).json({
            error: err.message,
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(400).json({
                message: "User not found",
            });
        }

        const isMatched = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (!isMatched) {
            return res.status(401).json({
                message: "Password does not match",
            });
        }

        const jwtSecret = getJwtSecret();
        const token = jwt.sign(
            { id: existingUser._id, role: existingUser.role || "user" },
            jwtSecret,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            token,
            user: {
                id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                stack: existingUser.stack,
                experienceLevel: existingUser.experienceLevel,
                role: existingUser.role || "user",
                avatar: existingUser.avatar || "",
                githubUsername: existingUser.githubUsername || "",
            },
        });
    } catch (err) {
        return res.status(500).json({
            error: err.message,
        });
    }
};

/**
 * GitHub OAuth / 3rd-Party Login
 * Exchanges GitHub OAuth code for user profile or links existing account
 */
export const githubOAuthLogin = async (req, res) => {
    try {
        const { code, githubUserData, githubUsername } = req.body;

        let githubProfile = githubUserData;

        // If authorization code provided, exchange with GitHub OAuth API
        if (code && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
            const tokenResponse = await axios.post(
                "https://github.com/login/oauth/access_token",
                {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                },
                { headers: { Accept: "application/json" } }
            );

            const accessToken = tokenResponse.data.access_token;
            if (accessToken) {
                const userResponse = await axios.get("https://api.github.com/user", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                githubProfile = userResponse.data;
            }
        }

        // If GitHub Personal Access Token provided
        const pat = req.body.token || req.body.personalAccessToken;
        if (!githubProfile && pat && typeof pat === "string") {
            try {
                const userResponse = await axios.get("https://api.github.com/user", {
                    headers: {
                        Accept: "application/vnd.github.v3+json",
                        Authorization: `Bearer ${pat.trim()}`,
                        "User-Agent": "Qurate-App",
                    },
                });
                githubProfile = userResponse.data;
            } catch (patErr) {
                const status = patErr.response?.status || 401;
                return res.status(status).json({
                    error: patErr.response?.data?.message || "Invalid GitHub Personal Access Token.",
                });
            }
        }

        // If GitHub username provided directly, fetch public GitHub profile
        if (!githubProfile && githubUsername && typeof githubUsername === "string") {
            try {
                const headers = {
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "Qurate-App",
                };
                if (process.env.GITHUB_TOKEN) {
                    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
                }
                const cleanUsername = encodeURIComponent(githubUsername.trim());
                const userResponse = await axios.get(`https://api.github.com/users/${cleanUsername}`, { headers });
                githubProfile = userResponse.data;
            } catch (ghErr) {
                const status = ghErr.response?.status || 500;
                if (status === 404) {
                    return res.status(404).json({ error: `GitHub user "${githubUsername}" not found.` });
                }
                return res.status(status).json({ error: ghErr.response?.data?.message || "Failed to fetch GitHub profile." });
            }
        }

        if (!githubProfile || !githubProfile.login) {
            return res.status(400).json({ error: "Invalid GitHub OAuth payload or user not specified." });
        }

        const email = githubProfile.email || `${githubProfile.login.toLowerCase()}@github.com`;
        let user = await User.findOne({ $or: [{ email }, { githubUsername: githubProfile.login }] });

        if (!user) {
            // Auto-provision OAuth user
            const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
            user = new User({
                username: githubProfile.name || githubProfile.login,
                email,
                password: dummyPassword,
                githubUsername: githubProfile.login,
                avatar: githubProfile.avatar_url || "",
                stack: ["javascript", "react", "node.js"],
                experienceLevel: "beginner",
                role: "user",
            });
            await user.save();
        } else if (!user.avatar && githubProfile.avatar_url) {
            user.avatar = githubProfile.avatar_url;
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id, role: user.role || "user" },
            getJwtSecret(),
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "GitHub OAuth login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                stack: user.stack,
                experienceLevel: user.experienceLevel,
                role: user.role || "user",
                avatar: user.avatar || "",
                githubUsername: user.githubUsername,
            },
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Email and password required" });
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

export const changeEmail = async (req, res) => {
    try {
        const { email, newEmail } = req.body;
        if (!email || !newEmail) return res.status(400).json({ message: "Email and newEmail required" });
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });
        const existing = await User.findOne({ email: newEmail });
        if (existing) return res.status(400).json({ message: "New email already in use" });
        user.email = newEmail;
        await user.save();
        return res.status(200).json({ message: "Email updated successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
