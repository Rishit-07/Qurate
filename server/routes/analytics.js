import express from "express";
import {
    getSqlContributorLeaderboard,
    getSqlRepositoryStats,
    getSqlUserDetailedProfile,
} from "../services/sqlAnalyticsService.js";

const router = express.Router();

/**
 * SQL Relational Analytics Endpoints demonstrating SQL PK/FK Schema and Multi-Table JOINs
 */

// 1. Contributor Leaderboard using LEFT JOIN across sql_users, sql_contributions, sql_repositories
router.get("/sql/leaderboard", async (req, res) => {
    try {
        const leaderboard = await getSqlContributorLeaderboard();
        return res.status(200).json({
            databaseEngine: "SQLite / Relational SQL",
            queryPattern: "MULTI_TABLE_LEFT_JOIN",
            leaderboard,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// 2. Repository Analytics using SQL JOIN and Aggregations
router.get("/sql/repositories", async (req, res) => {
    try {
        const repositories = await getSqlRepositoryStats();
        return res.status(200).json({
            databaseEngine: "SQLite / Relational SQL",
            queryPattern: "SQL_JOIN_GROUP_BY_AGGREGATE",
            repositories,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// 3. User Detailed Profile using SQL INNER JOINs
router.get("/sql/user/:id", async (req, res) => {
    try {
        const details = await getSqlUserDetailedProfile(req.params.id);
        return res.status(200).json({
            databaseEngine: "SQLite / Relational SQL",
            queryPattern: "SQL_INNER_JOIN_PK_FK",
            details,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
