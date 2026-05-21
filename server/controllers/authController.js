import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const getJwtSecret = () => process.env.JWT_SECRET || process.env.SECRET_KEY;


export const register = async (req, res) => {
    try {
        const {
            username,
            password,
            email,
            stack,
            experienceLevel,
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
            stack,
            experienceLevel,
        });

        await newUser.save();

        return res.status(201).json({
            message: "User registered successfully",
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
        if (!jwtSecret) {
            return res.status(500).json({ error: 'JWT secret is not configured on the server' });
        }

        const token = jwt.sign(
            { id: existingUser._id },
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
            },
        });
    } catch (err) {
        return res.status(500).json({
            error: err.message,
        });
    }
};

