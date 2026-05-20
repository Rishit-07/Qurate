import axios from 'axios'

const GITHUB_GRAPHQL = 'https://api.github.com/graphql'

export async function getContributions(req, res) {
  const username = req.query.username
  if (!username) return res.status(400).json({ error: 'username query param required' })

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return res.status(501).json({ error: 'GitHub token not configured on server' })
  }

  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 364)

  const query = `query($login:String!, $from:DateTime!, $to:DateTime!) {\n  user(login: $login) {\n    contributionsCollection(from: $from, to: $to) {\n      contributionCalendar {\n        totalContributions\n        weeks {\n          contributionDays {\n            date\n            contributionCount\n          }\n        }\n      }\n      totalCommitContributions\n      totalPullRequestContributions\n      totalIssueContributions\n      totalPullRequestReviewContributions\n    }\n  }\n}\n`

  try {
    const resp = await axios.post(
      GITHUB_GRAPHQL,
      {
        query,
        variables: {
          login: username,
          from: from.toISOString(),
          to: to.toISOString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (resp.data.errors) {
      return res.status(500).json({ error: resp.data.errors })
    }

    const coll = resp.data.data.user?.contributionsCollection
    if (!coll) return res.status(404).json({ error: 'User not found or no contributions' })

    const weeks = coll.contributionCalendar.weeks || []
    const counts = {}
    weeks.forEach((w) => {
      w.contributionDays.forEach((d) => {
        counts[d.date] = d.contributionCount
      })
    })

    return res.json({ counts, totals: {
      totalContributions: coll.contributionCalendar.totalContributions,
      commits: coll.totalCommitContributions,
      pullRequests: coll.totalPullRequestContributions,
      issues: coll.totalIssueContributions,
      reviews: coll.totalPullRequestReviewContributions,
    }})
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
