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
                    }
                    repositories(first: 5, orderBy: {field: UPDATED_AT, direction: DESC}) {
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
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.data.errors) {
            return res.status(404).json({ error: "GitHub user not found" });
        }

        const user = response.data.data.user;

        if (!user) {
            return res.status(404).json({ error: "GitHub user not found" });
        }

        const calendar = user.contributionsCollection.contributionCalendar;

        // Flatten weeks into a single array of days
        const days = calendar.weeks.flatMap(week => week.contributionDays);

        return res.status(200).json({
            username,
            totalContributions: calendar.totalContributions,
            days,
            repos: user.repositories.nodes,
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
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
            params: { per_page: 50 },
        });

        const events = response.data || [];

        const watchRepos = [...new Set(
            events
                .filter(ev => ev.type === 'WatchEvent')
                .map(ev => ev.repo?.name)
                .filter(Boolean)
        )];

        const latestCommitByRepo = new Map();
        await Promise.all(watchRepos.map(async (repoName) => {
            try {
                const commitResponse = await axios.get(`https://api.github.com/repos/${repoName}/commits`, {
                    headers: {
                        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                    params: { per_page: 1 },
                });

                const latestCommit = commitResponse.data?.[0];
                latestCommitByRepo.set(repoName, latestCommit?.commit?.message || 'Updated repository');
            } catch {
                latestCommitByRepo.set(repoName, 'Updated repository');
            }
        }));

        // Normalize a subset of event types into a lightweight activity item
        const items = events.map(ev => {
            const repoName = ev.repo?.name || '';
            const createdAt = ev.created_at;
            switch (ev.type) {
                case 'PushEvent': {
                    const commits = ev.payload?.commits || [];
                    const commitCount = commits.length;
                    if (commits.length === 0) return null;
                    const latestCommit = commits[commits.length - 1];
                    return {
                        source: 'github',
                        type: 'push',
                        title: `${commitCount} commit${commitCount !== 1 ? 's' : ''} pushed`,
                        commitCount,
                        recentChange: latestCommit?.message || 'Updated repository',
                        repoName,
                        url: `https://github.com/${repoName}`,
                        date: createdAt,
                    };
                }
                case 'CreateEvent': {
                    const ref_type = ev.payload?.ref_type || 'repo';
                    return {
                        source: 'github',
                        type: 'create',
                        title: `Created ${ref_type}`,
                        recentChange: `Created ${ref_type}${ev.payload?.ref ? ` ${ev.payload.ref}` : ''}`,
                        repoName,
                        url: `https://github.com/${repoName}`,
                        date: createdAt,
                    };
                }
                case 'WatchEvent': {
                    const recentCommitMessage = latestCommitByRepo.get(repoName);
                    return {
                        source: 'github',
                        type: 'watch',
                        title: 'Starred repository',
                        recentChange: recentCommitMessage ? `Latest commit: ${recentCommitMessage}` : 'Most recent commit unavailable',
                        repoName,
                        url: `https://github.com/${repoName}`,
                        date: createdAt,
                    };
                }
                case 'PullRequestEvent': {
                    const pr = ev.payload?.pull_request;
                    return {
                        source: 'github',
                        type: 'pull_request',
                        title: pr?.title || ev.payload?.action,
                        recentChange: pr?.title || ev.payload?.action || 'Updated pull request',
                        repoName,
                        url: pr?.html_url || `https://github.com/${repoName}`,
                        date: createdAt,
                    };
                }
                case 'IssuesEvent': {
                    const issue = ev.payload?.issue;
                    return {
                        source: 'github',
                        type: 'issue',
                        title: issue?.title || ev.payload?.action,
                        recentChange: issue?.title || ev.payload?.action || 'Updated issue',
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
                        recentChange: ev.type.replace(/Event$/, ''),
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