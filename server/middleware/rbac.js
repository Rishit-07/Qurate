import User from "../models/user.js";

/**
 * Role-Based Access Control Middleware (RBAC)
 * Verifies that the authenticated user has one of the required roles.
 * @param  {...string} allowedRoles - e.g. 'admin', 'moderator'
 */
export const authorize = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ error: "Unauthorized. Authentication required." });
            }

            const user = await User.findById(req.user.id).select("role username email");
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }

            const userRole = user.role || "user";

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    error: `Forbidden: Access restricted to roles [${allowedRoles.join(", ")}]. Current role: '${userRole}'.`,
                });
            }

            req.userRole = userRole;
            next();
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    };
};
