import User from "../models/User.js";
import jwt from "jsonwebtoken";


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
        await newUser.save();
        const token = jwt.sign(
            {
                id: newUser._id,
                email: newUser.email
            },
            process.env.JWT_SECRET,
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
                experienceLevel: newUser.experienceLevel
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
        const isMatched = await existingUser.matchPassword(password);

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
            process.env.JWT_SECRET,
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
                experienceLevel: existingUser.experienceLevel
            }
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
};