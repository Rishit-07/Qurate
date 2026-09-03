import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "../database.sqlite");

const sqlite = sqlite3.verbose();
export const sqlDb = new sqlite.Database(dbPath, (err) => {
    if (err) {
        console.error("Failed to connect to SQLite relational database:", err.message);
    } else {
        console.log("Connected to SQLite relational database.");
    }
});

// Helper for promise-based query execution
export const sqlQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        sqlDb.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

export const sqlRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        sqlDb.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

export const initSqlDatabase = async () => {
    // Enable Foreign Key constraints in SQLite
    await sqlRun("PRAGMA foreign_keys = ON;");

    // 1. Relational Users Table with Primary Key
    await sqlRun(`
        CREATE TABLE IF NOT EXISTS sql_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mongo_user_id TEXT UNIQUE,
            username TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            experience_level TEXT DEFAULT 'beginner',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 2. Relational Repositories Table with Primary Key
    await sqlRun(`
        CREATE TABLE IF NOT EXISTS sql_repositories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            repo_name TEXT NOT NULL UNIQUE,
            primary_language TEXT NOT NULL,
            stars_count INTEGER DEFAULT 0,
            open_issues_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 3. Relational Contributions Table with Foreign Keys referencing sql_users(id) and sql_repositories(id)
    await sqlRun(`
        CREATE TABLE IF NOT EXISTS sql_contributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            repository_id INTEGER NOT NULL,
            issue_title TEXT NOT NULL,
            pr_status TEXT CHECK(pr_status IN ('planned', 'submitted', 'merged')) NOT NULL DEFAULT 'planned',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES sql_users (id) ON DELETE CASCADE,
            FOREIGN KEY (repository_id) REFERENCES sql_repositories (id) ON DELETE CASCADE
        );
    `);

    // 4. Relational User Badges Table with Foreign Key referencing sql_users(id)
    await sqlRun(`
        CREATE TABLE IF NOT EXISTS sql_user_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            badge_name TEXT NOT NULL,
            badge_tier TEXT DEFAULT 'Bronze',
            awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES sql_users (id) ON DELETE CASCADE
        );
    `);

    // Seed initial relational data if tables are empty
    try {
        const usersCount = await sqlQuery("SELECT COUNT(*) as count FROM sql_users");
        if (usersCount[0]?.count === 0) {
            await sqlRun(`
                INSERT INTO sql_users (mongo_user_id, username, email, experience_level) VALUES
                ('seed_u1', 'alex_dev', 'alex@openqurate.dev', 'intermediate'),
                ('seed_u2', 'sarah_codes', 'sarah@openqurate.dev', 'advanced'),
                ('seed_u3', 'chen_builder', 'chen@openqurate.dev', 'beginner');
            `);

            await sqlRun(`
                INSERT INTO sql_repositories (repo_name, primary_language, stars_count, open_issues_count) VALUES
                ('facebook/react', 'JavaScript', 225000, 1100),
                ('expressjs/express', 'JavaScript', 63000, 150),
                ('pallets/flask', 'Python', 68000, 80),
                ('vercel/next.js', 'TypeScript', 121000, 2400);
            `);

            await sqlRun(`
                INSERT INTO sql_contributions (user_id, repository_id, issue_title, pr_status) VALUES
                (1, 1, 'Fix React hydration mismatch on Suspense fallback', 'merged'),
                (1, 2, 'Add regex path match support for route handlers', 'submitted'),
                (2, 4, 'Optimize bundle analyzer chunk caching', 'merged'),
                (2, 1, 'Refactor synthetic event propagation', 'merged'),
                (3, 3, 'Update tutorial docs for Blueprint registration', 'planned');
            `);

            await sqlRun(`
                INSERT INTO sql_user_badges (user_id, badge_name, badge_tier) VALUES
                (1, 'React Contributor', 'Gold'),
                (1, 'PR Machine', 'Silver'),
                (2, 'Master Architect', 'Diamond'),
                (3, 'First Step Explorer', 'Bronze');
            `);

            console.log("Seeded initial relational SQL database records with PK/FK links.");
        }
    } catch (e) {
        console.warn("SQL Seed check:", e.message);
    }
};
