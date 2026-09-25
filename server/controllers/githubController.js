import axios from "axios";

// Fetch GitHub contribution calendar via GraphQL API
export const getGithubContributions = async (req, res) => {
    const { username } = req.params;

    if (!username) {
        return res.status(400).json({ error: "GitHub username is required" });
    }

    try {
        const query = `
            query($username: String!) {
                user(login: $username) {
                    name
                    avatarUrl
                    contributionsCollection {
                        contributionCalendar {
                            totalContributions
                            weeks {
                                contributionDays {
                                    date
                                    contributionCount
                                    color
                                }
                            }
                        }
                        commitContributionsByRepository(maxRepositories: 100) {
                            repository {
                                nameWithOwner
                                url
                            }
                            contributions(first: 100) {
                                totalCount
                                nodes {
                                    occurredAt
                                    commitCount
                                    url
                                }
                            }
                        }
                        pullRequestContributions(first: 100) {
                            nodes {
                                occurredAt
                                pullRequest {
                                    title
                                    url
                                    state
                                    repository {
                                        nameWithOwner
                                    }
                                }
                            }
                        }
                        issueContributions(first: 100) {
                            nodes {
                                occurredAt
                                issue {
                                    title
                                    url
                                    state
                                    repository {
                                        nameWithOwner
                                    }
                                }
                            }
                        }
                    }
                    repositories(first: 6, orderBy: {field: UPDATED_AT, direction: DESC}) {
                        nodes {
                            name
                            stargazerCount
                            primaryLanguage {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const response = await axios.post(
            "https://api.github.com/graphql",
            { query, variables: { username } },
            {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                    "User-Agent": "Qurate-Platform/1.0",
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.data.errors) {
            return res.status(404).json({ error: "GitHub user not found" });
        }

        const user = response.data.data?.user;

        if (!user) {
            return res.status(404).json({ error: "GitHub user not found" });
        }

        const col = user.contributionsCollection;
        const calendar = col.contributionCalendar;

        // Flatten weeks into a single array of days
        const days = calendar.weeks.flatMap(week => week.contributionDays);

        // Build accurate monthly & daily breakdowns matching GitHub UI
        const monthsMap = new Map();
        const daysMap = new Map();

        const getMonthObj = (mKey) => {
            if (!monthsMap.has(mKey)) {
                const [y, m] = mKey.split('-');
                const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
                const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                monthsMap.set(mKey, {
                    monthKey: mKey,
                    monthLabel,
                    commitRepos: new Map(),
                    totalCommits: 0,
                    pullRequests: [],
                    issues: [],
                });
            }
            return monthsMap.get(mKey);
        };

        const getDayObj = (dKey) => {
            if (!daysMap.has(dKey)) {
                daysMap.set(dKey, {
                    date: dKey,
                    commitRepos: new Map(),
                    totalCommits: 0,
                    pullRequests: [],
                    issues: [],
                });
            }
            return daysMap.get(dKey);
        };

        // Populate commit contributions
        const commitItems = [];
        (col.commitContributionsByRepository || []).forEach(repoEntry => {
            const repoName = repoEntry.repository?.nameWithOwner || '';
            const repoUrl = repoEntry.repository?.url || `https://github.com/${repoName}`;

            (repoEntry.contributions?.nodes || []).forEach(cNode => {
                const commitCount = cNode.commitCount || 1;
                const occurredAt = cNode.occurredAt || '';
                const dateKey = occurredAt.slice(0, 10);
                const monthKey = dateKey.slice(0, 7);

                if (monthKey) {
                    const mObj = getMonthObj(monthKey);
                    mObj.totalCommits += commitCount;
                    if (!mObj.commitRepos.has(repoName)) {
                        mObj.commitRepos.set(repoName, { name: repoName, url: repoUrl, commits: 0 });
                    }
                    mObj.commitRepos.get(repoName).commits += commitCount;
                }

                if (dateKey) {
                    const dObj = getDayObj(dateKey);
                    dObj.totalCommits += commitCount;
                    if (!dObj.commitRepos.has(repoName)) {
                        dObj.commitRepos.set(repoName, { name: repoName, url: repoUrl, commits: 0 });
                    }
                    dObj.commitRepos.get(repoName).commits += commitCount;
                }

                commitItems.push({
                    source: 'github',
                    type: 'push',
                    title: `${commitCount} commit${commitCount !== 1 ? 's' : ''} to ${repoName}`,
                    commitCount,
                    recentChange: `Authored ${commitCount} commit${commitCount !== 1 ? 's' : ''}`,
                    repoName,
                    url: cNode.url || repoUrl,
                    date: occurredAt,
                });
            });
        });

        // Map PR contributions
        const prItems = (col.pullRequestContributions?.nodes || []).map(prNode => {
            const pr = prNode.pullRequest;
            const occurredAt = prNode.occurredAt || '';
            const dateKey = occurredAt.slice(0, 10);
            const monthKey = dateKey.slice(0, 7);
            const prData = {
                title: pr?.title || 'Contributed Pull Request',
                url: pr?.url || '',
                state: pr?.state || 'OPEN',
                repoName: pr?.repository?.nameWithOwner || '',
                date: occurredAt,
            };

            if (monthKey) getMonthObj(monthKey).pullRequests.push(prData);
            if (dateKey) getDayObj(dateKey).pullRequests.push(prData);

            return {
                source: 'github',
                type: 'pull_request',
                title: prData.title,
                recentChange: `PR status: ${prData.state}`,
                repoName: prData.repoName,
                url: prData.url,
                date: occurredAt,
            };
        });

        // Map Issue contributions
        const issueItems = (col.issueContributions?.nodes || []).map(issNode => {
            const issue = issNode.issue;
            const occurredAt = issNode.occurredAt || '';
            const dateKey = occurredAt.slice(0, 10);
            const monthKey = dateKey.slice(0, 7);
            const issData = {
                title: issue?.title || 'Reported Issue',
                url: issue?.url || '',
                state: issue?.state || 'OPEN',
                repoName: issue?.repository?.nameWithOwner || '',
                date: occurredAt,
            };

            if (monthKey) getMonthObj(monthKey).issues.push(issData);
            if (dateKey) getDayObj(dateKey).issues.push(issData);

            return {
                source: 'github',
                type: 'issue',
                title: issData.title,
                recentChange: `Issue status: ${issData.state}`,
                repoName: issData.repoName,
                url: issData.url,
                date: occurredAt,
            };
        });

        // Format monthlyActivity array
        const monthlyActivity = Array.from(monthsMap.values())
            .map(m => ({
                monthKey: m.monthKey,
                monthLabel: m.monthLabel,
                totalCommits: m.totalCommits,
                commitRepos: Array.from(m.commitRepos.values()).sort((a, b) => b.commits - a.commits),
                pullRequests: m.pullRequests,
                issues: m.issues,
            }))
            .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

        // Format dailyActivity dictionary
        const dailyActivity = {};
        for (const [dKey, d] of daysMap.entries()) {
            dailyActivity[dKey] = {
                date: d.date,
                totalCommits: d.totalCommits,
                commitRepos: Array.from(d.commitRepos.values()).sort((a, b) => b.commits - a.commits),
                pullRequests: d.pullRequests,
                issues: d.issues,
            };
        }

        return res.status(200).json({
            username,
            totalContributions: calendar.totalContributions,
            days,
            repos: user.repositories.nodes,
            historyItems: [...commitItems, ...prItems, ...issueItems],
            monthlyActivity,
            dailyActivity,
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Fetch real-time specific day activity via GraphQL
export const getGithubDayActivity = async (req, res) => {
    const { username } = req.params;
    const { date } = req.query; // format YYYY-MM-DD

    if (!username || !date) {
        return res.status(400).json({ error: "Username and date query (YYYY-MM-DD) are required" });
    }

    try {
        const from = `${date}T00:00:00Z`;
        const to = `${date}T23:59:59Z`;

        const query = `
            query($username: String!, $from: DateTime, $to: DateTime) {
                user(login: $username) {
                    contributionsCollection(from: $from, to: $to) {
                        totalCommitContributions
                        totalIssueContributions
                        totalPullRequestContributions
                        commitContributionsByRepository(maxRepositories: 50) {
                            repository {
                                nameWithOwner
                                url
                            }
                            contributions(first: 50) {
                                totalCount
                                nodes {
                                    occurredAt
                                    commitCount
                                    url
                                }
                            }
                        }
                        pullRequestContributions(first: 20) {
                            nodes {
                                occurredAt
                                pullRequest {
                                    title
                                    url
                                    state
                                    repository {
                                        nameWithOwner
                                    }
                                }
                            }
                        }
                        issueContributions(first: 20) {
                            nodes {
                                occurredAt
                                issue {
                                    title
                                    url
                                    state
                                    repository {
                                        nameWithOwner
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await axios.post(
            "https://api.github.com/graphql",
            { query, variables: { username, from, to } },
            {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                    "User-Agent": "Qurate-Platform/1.0",
                    "Content-Type": "application/json",
                },
            }
        );

        const col = response.data?.data?.user?.contributionsCollection;
        if (!col) {
            return res.status(200).json({ date, totalCommits: 0, commitRepos: [], pullRequests: [], issues: [] });
        }

        const commitRepos = (col.commitContributionsByRepository || []).map(r => ({
            name: r.repository?.nameWithOwner || '',
            url: r.repository?.url || `https://github.com/${r.repository?.nameWithOwner || ''}`,
            commits: r.contributions?.totalCount || 0,
        })).filter(r => r.commits > 0).sort((a, b) => b.commits - a.commits);

        const pullRequests = (col.pullRequestContributions?.nodes || []).map(node => ({
            title: node.pullRequest?.title || 'Pull Request',
            url: node.pullRequest?.url || '',
            state: node.pullRequest?.state || 'OPEN',
            repoName: node.pullRequest?.repository?.nameWithOwner || '',
            date: node.occurredAt,
        }));

        const issues = (col.issueContributions?.nodes || []).map(node => ({
            title: node.issue?.title || 'Issue',
            url: node.issue?.url || '',
            state: node.issue?.state || 'OPEN',
            repoName: node.issue?.repository?.nameWithOwner || '',
            date: node.occurredAt,
        }));

        return res.status(200).json({
            date,
            totalCommits: col.totalCommitContributions || 0,
            commitRepos,
            pullRequests,
            issues,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Fetch recent GitHub public activity for a user (events) and normalize
export const getGithubActivity = async (req, res) => {
    const { username } = req.params;
    if (!username) return res.status(400).json({ error: 'GitHub username required' });

    try {
        const response = await axios.get(`https://api.github.com/users/${username}/events`, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                "User-Agent": "Qurate-Platform/1.0",
                Accept: 'application/vnd.github.v3+json',
            },
            params: { per_page: 50 },
        });

        const events = response.data || [];

        // Normalize public event types into high-fidelity activity items
        const items = events.map(ev => {
            const repoName = ev.repo?.name || '';
            const createdAt = ev.created_at;
            switch (ev.type) {
                case 'PushEvent': {
                    const branch = ev.payload?.ref ? ev.payload.ref.replace('refs/heads/', '') : 'main';
                    const commitCount = ev.payload?.commits?.length || ev.payload?.size || ev.payload?.distinct_size || 1;
                    const headSha = ev.payload?.head ? ev.payload.head.slice(0, 7) : '';
                    const message = ev.payload?.commits?.[0]?.message || (headSha ? `Commit ${headSha} on ${branch}` : `Pushed updates to ${branch}`);
                    return {
                        source: 'github',
                        type: 'push',
                        title: `${commitCount} commit${commitCount !== 1 ? 's' : ''} pushed to ${branch}`,
                        commitCount,
                        recentChange: message,
                        repoName,
                        url: `https://github.com/${repoName}/commits/${branch}`,
                        date: createdAt,
                    };
                }
                case 'CreateEvent': {
                    const ref_type = ev.payload?.ref_type || 'repo';
                    const refName = ev.payload?.ref ? ` ${ev.payload.ref}` : '';
                    return {
                        source: 'github',
                        type: 'create',
                        title: `Created ${ref_type}${refName}`,
                        recentChange: `Created ${ref_type}${refName} in ${repoName}`,
                        repoName,
                        url: `https://github.com/${repoName}`,
                        date: createdAt,
                    };
                }
                case 'WatchEvent': {
                    return {
                        source: 'github',
                        type: 'watch',
                        title: 'Starred repository',
                        recentChange: `Starred ${repoName}`,
                        repoName,
                        url: `https://github.com/${repoName}`,
                        date: createdAt,
                    };
                }
                case 'ForkEvent': {
                    const forkUrl = ev.payload?.forkee?.html_url || `https://github.com/${repoName}`;
                    return {
                        source: 'github',
                        type: 'create',
                        title: `Forked repository`,
                        recentChange: `Forked ${repoName}`,
                        repoName,
                        url: forkUrl,
                        date: createdAt,
                    };
                }
                case 'PullRequestEvent': {
                    const pr = ev.payload?.pull_request;
                    const action = ev.payload?.action || 'opened';
                    return {
                        source: 'github',
                        type: 'pull_request',
                        title: pr?.title || `Pull Request (${action})`,
                        recentChange: `${action.toUpperCase()}: ${pr?.title || 'Pull request'}`,
                        repoName,
                        url: pr?.html_url || `https://github.com/${repoName}`,
                        date: createdAt,
                    };
                }
                case 'IssuesEvent': {
                    const issue = ev.payload?.issue;
                    const action = ev.payload?.action || 'opened';
                    return {
                        source: 'github',
                        type: 'issue',
                        title: issue?.title || `Issue (${action})`,
                        recentChange: `${action.toUpperCase()}: ${issue?.title || 'Issue'}`,
                        repoName,
                        url: issue?.html_url || `https://github.com/${repoName}`,
                        date: createdAt,
                    };
                }
                default:
                    return {
                        source: 'github',
                        type: ev.type,
                        title: ev.type.replace(/Event$/, ''),
                        recentChange: `${ev.type.replace(/Event$/, '')} in ${repoName}`,
                        repoName,
                        url: `https://github.com/${repoName}`,
                        date: createdAt,
                    };
            }
        }).filter(Boolean);

        return res.status(200).json({ username, items });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};