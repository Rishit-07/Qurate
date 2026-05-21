# ✦ Qurate - AI-Powered Open Source Discovery Engine

Stop searching blindly. Qurate finds GitHub issues that match your exact stack, scores them with AI, and tracks your contributor journey from first bookmark to merged PR.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [AI Scoring System](#ai-scoring-system)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Overview

GitHub has millions of open issues. That is not helpful. When you search "good first issue" you get a wall of results from projects you have never heard of, in languages you do not use, for problems that were closed three months ago and nobody updated the label.

Qurate solves this by pulling real issues from GitHub, filtering them against a developer's declared stack and experience level, and using the Gemini AI model to score how well each issue fits that specific developer.

The result is a personalised feed of issues that are genuinely relevant with a plain English explanation for every score.

---

## Features

### Core
- **Personalised Feed** — Issues filtered to your exact stack and experience level, not a generic list
- **AI Fit Scoring** — Every issue gets a score from 1–10 with a one-sentence reason powered by Gemini
- **JWT Authentication** — Secure register and login with bcrypt password hashing
- **Issue Search** — Free-text search against GitHub with live sync to the database
- **Background Sync** — Cron job refreshes the issue pool every six hours automatically

### Contribution Tracking
- **Bookmark System** — Save issues you want to work on and revisit them anytime
- **Contribution Log** — Track every issue you have touched with planned, submitted, and merged statuses
- **GitHub Heatmap** — Live contribution calendar pulled directly from the GitHub GraphQL API

### Profile
- **Editable Profile** — Update display name, GitHub username, stack, and experience level
- **Stack Selector** — Toggle chips to declare your languages and frameworks
- **Live Stats** — Merged, submitted, and planned contribution counts at a glance

### Discover
- **Explore Page** — Animated search interface with typewriter prompt suggestions
- **Result Sync** — Search results are saved to MongoDB so scores can be cached later
- **Complexity Tags** — Every issue is tagged beginner, intermediate, or advanced

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router v6 |
| HTTP Client | Axios with JWT interceptor |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Scheduling | node-cron |
| AI Scoring | Google Gemini API |
| GitHub Data | GitHub REST API, GitHub GraphQL API |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas |

---

## Project Structure

```
qurate/
├── client/                           React frontend
│   └── src/
│       ├── api/
│       │   └── axios.js              Axios instance with JWT interceptor
│       └── pages/
│           ├── AuthPage.jsx          Landing page and authentication
│           ├── DiscoveryFeed.jsx     Personalised issue feed
│           ├── DiscoverPage.jsx      Free-text GitHub search
│           ├── BookmarkPage.jsx      Saved issues
│           ├── Profile.jsx           Profile, heatmap, contribution log
│           └── AboutPage.jsx         About page
│
└── server/                           Express backend
    ├── config/
    │   └── database.js               MongoDB connection
    ├── controllers/
    │   ├── authController.js         Register and login
    │   ├── issueController.js        Feed, search, sync, AI scoring
    │   ├── githubController.js       GraphQL contribution calendar
    │   └── userController.js         Profile updates, contribution log
    ├── middleware/
    │   └── auth.js                   JWT verification
    ├── models/
    │   ├── user.js                   User schema
    │   ├── issue.js                  Issue schema with fit score subdocument
    │   └── fitScoreSchema.js         Fit score subdocument
    ├── routes/
    │   ├── auth.js
    │   ├── issues.js
    │   ├── github.js
    │   └── user.js
    ├── services/
    │   ├── githubServices.js         GitHub REST API calls
    │   ├── aiScoringService.js       Gemini scoring logic
    │   └── issueSyncScheduler.js     Cron sync job
    └── index.js                      Entry point
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A MongoDB Atlas account and cluster
- A GitHub **classic** personal access token with `public_repo` and `read:user` scopes
- A Google AI Studio API key for Gemini

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/qurate.git
cd qurate
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file in `/server` — see [Environment Variables](#environment-variables) below.

```bash
node index.js
```

### 3. Set up the frontend

```bash
cd client
npm install
npm run dev
```

The React app will be available at `http://localhost:5173`.

### 4. Seed initial data

Trigger the first GitHub issue sync by hitting this endpoint once:

```
GET http://localhost:5000/api/issues/sync
```

The background cron job takes over from there and syncs every six hours automatically.

---

## Environment Variables

### Server `/server/.env`

| Variable | Description |
|----------|-------------|
| PORT | Backend port (default: 5000) |
| MONGO_URI | MongoDB Atlas connection string |
| JWT_SECRET | Secret key for signing JWTs |
| GITHUB_TOKEN | Classic GitHub personal access token |
| GEMINI_API_KEY | Google AI Studio key for Gemini |

### Client `/client/.env`

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend URL (default: http://localhost:5000) |

---

## API Reference

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Create a new account | No |
| POST | /api/auth/login | Sign in and receive a JWT | No |

### Issues

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/issues | Paginated feed with stack and complexity filters | No |
| GET | /api/issues/sync | Trigger a manual GitHub issue sync | No |
| GET | /api/issues/search?q= | Search GitHub issues by keyword | No |
| POST | /api/issues/:id/score | Request an AI fit score for an issue | Yes |

### GitHub

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/github/contributions/:username | Fetch contribution calendar from GitHub GraphQL | Yes |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/users/contributions | Retrieve contribution log | Yes |
| PUT | /api/users/profile | Update profile, stack, and settings | Yes |

---

## AI Scoring System

The scoring system is lazy by design. Calling the AI API on every page load would be slow and expensive. Instead, scores are generated on demand and cached permanently.

### How a score is generated

1. The issue is automatically checked.
2. Server checks if a score already exists for that user on that issue
3. If yes — returns the cached result instantly, no API call made
4. If no — builds a structured prompt with the issue title, labels, complexity, the user's stack, and their experience level
5. Prompt is sent to Gemini with a strict instruction to return only JSON: a score from 1–10 and a reason under 15 words
6. Response is parsed, validated, and written to the `fitScores` array on the issue document
7. All future requests from that user return the cached result

One API call per user per issue. Maximum.

### Score tiers

| Score | Meaning |
|-------|---------|
| 8–10 | Strong match — your stack aligns directly with the issue |
| 5–7 | Partial match — adjacent skills, learnable gap |
| 1–4 | Weak match — outside your current stack |

---

## Roadmap

- [ ] GitHub OAuth sign-in
- [ ] Curate issues according to the 
- [ ] Public profile pages to share contribution history
- [ ] Mobile app (React Native)

---

## Author

Built by **Sai Rishit Sunku**, a solo capstone project built with React, Node.js, MongoDB, Express, and the Gemini API.

Built because finding a good open source issue to work on should not require two hours of searching and three tabs of disappointment.

---

## License

MIT
