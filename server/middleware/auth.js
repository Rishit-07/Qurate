import jwt from "jsonwebtoken";

const getJwtSecret = () => process.env.JWT_SECRET || process.env.SECRET_KEY;

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "No token provided"
        });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(
            token,
            getJwtSecret()
        );
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
};

export default protect;