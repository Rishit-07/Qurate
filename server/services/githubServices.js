import axios from "axios";

const searchProfiles = [
    {
        stack: "javascript",
        language: "javascript",
        complexity: "beginner",
        query: "label:good-first-issue language:javascript state:open",
    },
    {
        stack: "javascript",
        language: "javascript",
        complexity: "intermediate",
        query: "label:help-wanted language:javascript state:open",
    },
    {
        stack: "javascript",
        language: "javascript",
        complexity: "advanced",
        query: "language:javascript state:open comments:>5",
    },
    {
        stack: "react",
        language: "javascript",
        complexity: "beginner",
        query: "react label:good-first-issue language:javascript state:open",
    },
    {
        stack: "nodejs",
        language: "javascript",
        complexity: "intermediate",
        query: "nodejs label:help-wanted language:javascript state:open",
    },
    {
        stack: "python",
        language: "python",
        complexity: "beginner",
        query: "label:good-first-issue language:python state:open",
    },
    {
        stack: "python",
        language: "python",
        complexity: "intermediate",
        query: "label:help-wanted language:python state:open",
    },
    {
        stack: "python",
        language: "python",
        complexity: "advanced",
        query: "language:python state:open comments:>5",
    },
    {
        stack: "vue",
        language: "vue",
        complexity: "beginner",
        query: "label:good-first-issue language:vue state:open",
    },
    {
        stack: "typescript",
        language: "typescript",
        complexity: "beginner",
        query: "label:good-first-issue language:typescript state:open",
    },
    {
        stack: "go",
        language: "go",
        complexity: "beginner",
        query: "label:good-first-issue language:go state:open",
    },
    {
        stack: "rust",
        language: "rust",
        complexity: "beginner",
        query: "label:good-first-issue language:rust state:open",
    },
    {
        stack: "java",
        language: "java",
        complexity: "beginner",
        query: "label:good-first-issue language:java state:open",
    },
    {
        stack: "php",
        language: "php",
        complexity: "beginner",
        query: "label:good-first-issue language:php state:open",
    },
    {
        stack: "ruby",
        language: "ruby",
        complexity: "beginner",
        query: "label:good-first-issue language:ruby state:open",
    },
    {
        stack: "swift",
        language: "swift",
        complexity: "beginner",
        query: "label:good-first-issue language:swift state:open",
    },
    {
        stack: "kotlin",
        language: "kotlin",
        complexity: "beginner",
        query: "label:good-first-issue language:kotlin state:open",
    },
    {
        stack: "dart",
        language: "dart",
        complexity: "beginner",
        query: "label:good-first-issue language:dart state:open",
    },
    {
        stack: "mongodb",
        language: "javascript",
        complexity: "intermediate",
        query: "mongodb label:help-wanted language:javascript state:open",
    },
];

export const fetchGithubIssues = async () => {
    const githubToken = process.env.GITHUB_TOKEN?.trim();
    const pageSize = 10;
    const headers = {
        Accept: "application/vnd.github.v3+json",
    };

    if (githubToken) {
        headers.Authorization = `token ${githubToken}`;
    }

    const issueGroups = await Promise.all(
        searchProfiles.map(async (profile) => {
            const response = await axios.get("https://api.github.com/search/issues", {
                headers,
                params: {
                    q: profile.query,
                    sort: "updated",
                    per_page: pageSize,
                },
            });

            return response.data.items.map((issue) => mapGithubIssue(issue, profile));
        })
    );

    return dedupeIssues(issueGroups.flat());
};

export const searchGithubIssues = async (query) => {
    const githubToken = process.env.GITHUB_TOKEN?.trim();
    const headers = {
        Accept: "application/vnd.github.v3+json",
    };

    if (githubToken) {
        headers.Authorization = `token ${githubToken}`;
    }

    // Sanitize the incoming query to avoid GitHub search parsing issues
    const safeQuery = String(query || '').replace(/#/g, '').replace(/"/g, '').trim();
    const languageProfile = detectLanguageProfile(safeQuery);

    let githubQuery = `${safeQuery} state:open`;

    if (languageProfile) {
        const remainder = safeQuery
            .replace(languageProfile.queryPattern, '')
            .trim();

        githubQuery = `language:${languageProfile.language}`;

        if (remainder) {
            githubQuery += ` "${remainder}"`;
        }

        githubQuery += ' state:open';
    } else if (safeQuery) {
        // Wrap in quotes to prefer exact-phrase matches for user-provided text
        githubQuery = `"${safeQuery}" state:open`;
    }

    const response = await axios.get("https://api.github.com/search/issues", {
        headers,
        params: {
            q: githubQuery,
            sort: "updated",
            per_page: 10,
        },
    });

    const mappedIssues = response.data.items.map((issue) =>
        mapGithubIssue(issue, buildSearchProfile(query, issue.labels))
    );

    if (languageProfile) {
        return mappedIssues.filter((issue) => matchesLanguageProfile(issue, languageProfile.profile));
    }

    return mappedIssues;
};

const mapGithubIssue = (issue, profile) => {
    const labels = issue.labels.map((label) => label.name);

    return {
        github_id: issue.id,
        title: issue.title,
        body: issue.body,
        html_url: issue.html_url,
        labels,
        repo: {
            name: issue.repository_url.split("/").slice(-1)[0],
            stars: 0,
            language: profile.language,
        },
        stacks: [profile.stack],
        complexity: inferComplexity(labels, profile.complexity),
    };
};

const buildSearchProfile = (query, labels) => {
    const normalizedQuery = query.toLowerCase();
    const labelNames = labels.map((label) => label.name.toLowerCase()).join(" ");
    const searchableText = `${normalizedQuery} ${labelNames}`;

    const languageProfile = detectLanguageProfile(searchableText);

    if (languageProfile) {
        return languageProfile.profile;
    }

    if (searchableText.includes("python")) {
        return { stack: "python", language: "python", complexity: "beginner" };
    }

    if (searchableText.includes("react")) {
        return { stack: "react", language: "javascript", complexity: "beginner" };
    }

    if (searchableText.includes("node")) {
        return { stack: "nodejs", language: "javascript", complexity: "intermediate" };
    }

    if (searchableText.includes("vue")) {
        return { stack: "vue", language: "vue", complexity: "beginner" };
    }

    if (searchableText.includes("mongo")) {
        return { stack: "mongodb", language: "javascript", complexity: "intermediate" };
    }

    return { stack: "javascript", language: "javascript", complexity: "beginner" };
};

const detectLanguageProfile = (text) => {
    const normalized = String(text || '').toLowerCase();

    const profiles = [
        { patterns: [/\btypescript\b/, /\btsx\b/], profile: { stack: "typescript", language: "typescript", complexity: "beginner" }, queryPattern: /\btypescript\b|\btsx\b/ },
        { patterns: [/\bgolang\b/, /\bgo\b/], profile: { stack: "go", language: "go", complexity: "beginner" }, queryPattern: /\bgolang\b|\bgo\b/ },
        { patterns: [/\brust\b/], profile: { stack: "rust", language: "rust", complexity: "beginner" }, queryPattern: /\brust\b/ },
        { patterns: [/\bjavascript\b/, /\bjs\b/], profile: { stack: "javascript", language: "javascript", complexity: "beginner" }, queryPattern: /\bjavascript\b|\bjs\b/ },
        { patterns: [/\bjava\b/], profile: { stack: "java", language: "java", complexity: "beginner" }, queryPattern: /\bjava\b/ },
        { patterns: [/\bpython\b/], profile: { stack: "python", language: "python", complexity: "beginner" }, queryPattern: /\bpython\b/ },
        { patterns: [/\bruby\b/], profile: { stack: "ruby", language: "ruby", complexity: "beginner" }, queryPattern: /\bruby\b/ },
        { patterns: [/\bphp\b/], profile: { stack: "php", language: "php", complexity: "beginner" }, queryPattern: /\bphp\b/ },
        { patterns: [/\bswift\b/], profile: { stack: "swift", language: "swift", complexity: "beginner" }, queryPattern: /\bswift\b/ },
        { patterns: [/\bkotlin\b/], profile: { stack: "kotlin", language: "kotlin", complexity: "beginner" }, queryPattern: /\bkotlin\b/ },
        { patterns: [/\bdart\b/], profile: { stack: "dart", language: "dart", complexity: "beginner" }, queryPattern: /\bdart\b/ },
        { patterns: [/\bvue\b/], profile: { stack: "vue", language: "vue", complexity: "beginner" }, queryPattern: /\bvue\b/ },
        { patterns: [/\bmongo(db)?\b/], profile: { stack: "mongodb", language: "javascript", complexity: "intermediate" }, queryPattern: /\bmongo(db)?\b/ },
        { patterns: [/\bnode(\.js)?\b/], profile: { stack: "nodejs", language: "javascript", complexity: "intermediate" }, queryPattern: /\bnode(\.js)?\b/ },
        { patterns: [/\breact\b/], profile: { stack: "react", language: "javascript", complexity: "beginner" }, queryPattern: /\breact\b/ },
    ];

    return profiles.find(({ patterns }) => patterns.some((pattern) => pattern.test(normalized))) || null;
};

const matchesLanguageProfile = (issue, profile) => {
    const issueLanguage = String(issue.repo?.language || '').toLowerCase();
    const issueStack = String(issue.stacks?.[0] || '').toLowerCase();
    const targetLanguage = String(profile.language || '').toLowerCase();
    const targetStack = String(profile.stack || '').toLowerCase();

    if (!targetLanguage && !targetStack) return true;

    return (
        issueLanguage === targetLanguage ||
        issueStack === targetStack ||
        issueStack === targetLanguage ||
        issueLanguage === targetStack
    );
};

const inferComplexity = (labels, fallback) => {
    const normalizedLabels = labels.map((label) => label.toLowerCase());

    if (normalizedLabels.some((label) => /advanced|hard|expert|complex/.test(label))) {
        return "advanced";
    }

    if (normalizedLabels.some((label) => /intermediate|medium|help wanted/.test(label))) {
        return "intermediate";
    }

    if (normalizedLabels.some((label) => /good first|beginner|easy|starter/.test(label))) {
        return "beginner";
    }

    return fallback;
};

const dedupeIssues = (issues) => {
    const byGithubId = new Map();

    for (const issue of issues) {
        const existing = byGithubId.get(issue.github_id);

        if (existing) {
            byGithubId.set(issue.github_id, {
                ...existing,
                labels: [...new Set([...existing.labels, ...issue.labels])],
                stacks: [...new Set([...existing.stacks, ...issue.stacks])],
                complexity: highestComplexity(existing.complexity, issue.complexity),
            });
        } else {
            byGithubId.set(issue.github_id, issue);
        }
    }

    return [...byGithubId.values()];
};

const highestComplexity = (current, next) => {
    const rank = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
    };

    return rank[next] > rank[current] ? next : current;
};
