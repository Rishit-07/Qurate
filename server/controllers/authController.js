import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const getJwtSecret = () => process.env.JWT_SECRET || process.env.SECRET_KEY;


export const register = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            stack,
            experienceLevel
        } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }
        const newUser = new User({
            username,
            email,
            password,
            stack,
            experienceLevel
        });
        newUser.password = await bcrypt.hash(password, 10);
        await newUser.save();
        const token = jwt.sign(
            {
                id: newUser._id,
                email: newUser.email
            },
            getJwtSecret(),
            {
                expiresIn: "7d"
            }
        );

        return res.status(201).json({
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                stack: newUser.stack,
                experienceLevel: newUser.experienceLevel,
                githubUsername: newUser.githubUsername
            }
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
};


export const login = async (req, res) => {
    try {

        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(400).json({
                message: "User not found"
            });
        }
        const isMatched = await bcrypt.compare(password, existingUser.password);

        if (!isMatched) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
        const token = jwt.sign(
            {
                id: existingUser._id,
                email: existingUser.email
            },
            getJwtSecret(),
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            token,
            user: {
                id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                stack: existingUser.stack,
                experienceLevel: existingUser.experienceLevel,
                githubUsername: existingUser.githubUsername
            }
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
};

