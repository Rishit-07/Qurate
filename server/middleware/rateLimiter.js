import rateLimit from "express-rate-limit";

// General API rate limiter (100 requests per 15 minutes)
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests from this IP, please try again after 15 minutes.",
    },
});

// Stricter rate limiter for authentication routes (login/register: 15 requests per 15 minutes)
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many authentication attempts. Please try again later.",
    },
});

// AI endpoints rate limiter (30 requests per minute)
export const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "AI rate limit reached. Please wait a moment before sending more requests.",
    },
});
