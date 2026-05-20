import { syncIssuesToDatabase } from "../controllers/issueController.js";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

let syncTimer;
let syncInProgress = false;

const runScheduledIssueSync = async () => {
    if (syncInProgress) {
        console.log("Issue sync skipped because a sync is already running");
        return;
    }

    syncInProgress = true;

    try {
        const syncedCount = await syncIssuesToDatabase();
        console.log(`Scheduled issue sync completed: ${syncedCount} issues refreshed`);
    } catch (error) {
        console.error("Scheduled issue sync failed:", error.message);
    } finally {
        syncInProgress = false;
    }
};

export const startIssueSyncScheduler = () => {
    if (syncTimer) return;

    runScheduledIssueSync();
    syncTimer = setInterval(runScheduledIssueSync, ONE_DAY_IN_MS);
};
