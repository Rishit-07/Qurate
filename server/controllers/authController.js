import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
// token-based reset flow removed; no crypto or dotenv needed here

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

export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'User not found' })
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    await user.save()
    return res.status(200).json({ message: 'Password has been reset successfully' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

export const changeEmail = async (req, res) => {
    try {
        const { email, newEmail } = req.body
        if (!email || !newEmail) return res.status(400).json({ message: 'Email and newEmail required' })
        const user = await User.findOne({ email })
        if (!user) return res.status(400).json({ message: 'User not found' })
        const existing = await User.findOne({ email: newEmail })
        if (existing) return res.status(400).json({ message: 'New email already in use' })
        user.email = newEmail
        await user.save()
        return res.status(200).json({ message: 'Email updated successfully' })
    } catch (err) {
        return res.status(500).json({ error: err.message })
    }
}

