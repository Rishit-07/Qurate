import axios from "axios";

export const fetchGithubIssues = async (language = "javascript") => {
    const githubToken = process.env.GITHUB_TOKEN?.trim();
    const pageSize = 10;
    const response = await axios.get("https://api.github.com/search/issues", {
        headers: {
            Authorization: `token ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
        },
        params: {
            q: `label:good-first-issue language:${language} state:open`,
            sort: "updated",
            per_page: pageSize,
        },
    });

    return response.data.items.map((issue) => ({
        github_id: issue.id,
        title: issue.title,
        body: issue.body,
        html_url: issue.html_url,
        labels: issue.labels.map((l) => l.name),
        repo: {
            name: issue.repository_url.split("/").slice(-1)[0],
            stars: 0,
            language: language,
        },
        stacks: [language],
        complexity: "beginner",
    }));
};