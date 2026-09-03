/**
 * Input sanitization middleware to prevent NoSQL injection, XSS vectors, and null-byte attacks
 * Express 5 compatible: mutates in-place without reassigning getter properties.
 */
const cleanString = (val) => {
    if (typeof val !== "string") return val;
    return val
        .replace(/\0/g, "")
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .trim();
};

const sanitizeDeep = (obj) => {
    if (!obj || typeof obj !== "object") return;

    for (const key of Object.keys(obj)) {
        // Disallow keys starting with $ or containing . which could be used for NoSQL injection
        if (key.startsWith("$") || key.includes(".")) {
            delete obj[key];
            continue;
        }

        const value = obj[key];
        if (typeof value === "string") {
            obj[key] = cleanString(value);
        } else if (Array.isArray(value)) {
            obj[key] = value.map((item) => (typeof item === "string" ? cleanString(item) : item));
        } else if (value !== null && typeof value === "object") {
            sanitizeDeep(value);
        }
    }
};

export const sanitizeInput = (req, res, next) => {
    if (req.body && typeof req.body === "object") sanitizeDeep(req.body);
    if (req.query && typeof req.query === "object") sanitizeDeep(req.query);
    if (req.params && typeof req.params === "object") sanitizeDeep(req.params);

    next();
};
