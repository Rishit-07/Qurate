import { sqlQuery } from "../config/sqlDatabase.js";

/**
 * SQL Analytics Service demonstrating Relational Schema queries & multi-table SQL JOINs
 */

/**
 * 1. Multi-Table SQL JOIN: Contributor Leaderboard
 * Joins sql_users, sql_contributions, and sql_repositories using Foreign Keys
 */
export const getSqlContributorLeaderboard = async () => {
    const sql = `
        SELECT 
            u.id AS user_id,
            u.username,
            u.experience_level,
            COUNT(c.id) AS total_contributions,
            SUM(CASE WHEN c.pr_status = 'merged' THEN 1 ELSE 0 END) AS merged_prs,
            SUM(CASE WHEN c.pr_status = 'submitted' THEN 1 ELSE 0 END) AS submitted_prs,
            GROUP_CONCAT(DISTINCT r.repo_name) AS active_repositories
        FROM sql_users u
        LEFT JOIN sql_contributions c ON u.id = c.user_id
        LEFT JOIN sql_repositories r ON c.repository_id = r.id
        GROUP BY u.id, u.username, u.experience_level
        ORDER BY merged_prs DESC, total_contributions DESC;
    `;
    return await sqlQuery(sql);
};

/**
 * 2. Multi-Table SQL INNER JOIN: User Badges and Detailed Contribution History
 */
export const getSqlUserDetailedProfile = async (userId) => {
    // INNER JOIN on user badges
    const badgesSql = `
        SELECT 
            b.id AS badge_id,
            b.badge_name,
            b.badge_tier,
            b.awarded_at
        FROM sql_user_badges b
        INNER JOIN sql_users u ON b.user_id = u.id
        WHERE u.id = ?;
    `;

    // INNER JOIN on user contributions with repository metadata
    const contributionsSql = `
        SELECT 
            c.id AS contribution_id,
            c.issue_title,
            c.pr_status,
            c.created_at,
            r.repo_name,
            r.primary_language,
            r.stars_count
        FROM sql_contributions c
        INNER JOIN sql_repositories r ON c.repository_id = r.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC;
    `;

    const badges = await sqlQuery(badgesSql, [userId]);
    const contributions = await sqlQuery(contributionsSql, [userId]);

    return {
        userId,
        badges,
        contributions,
    };
};

/**
 * 3. Repository Analytics via SQL JOIN and Aggregation
 */
export const getSqlRepositoryStats = async () => {
    const sql = `
        SELECT 
            r.id AS repo_id,
            r.repo_name,
            r.primary_language,
            r.stars_count,
            r.open_issues_count,
            COUNT(c.id) AS tracked_contributions,
            COUNT(DISTINCT c.user_id) AS unique_contributors
        FROM sql_repositories r
        LEFT JOIN sql_contributions c ON r.id = c.repository_id
        GROUP BY r.id, r.repo_name, r.primary_language, r.stars_count, r.open_issues_count
        ORDER BY tracked_contributions DESC;
    `;
    return await sqlQuery(sql);
};
