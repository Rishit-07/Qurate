# ✦ Git Workflow & Engineering Practices Guide — Qurate

**Curriculum Concept:** Git Workflow (Engineering Practices • 0.3 pts)  
**Standard:** Conventional Commits v1.0.0 & Git Feature Branching

---

## 1. Branching Strategy

Qurate follows a structured feature-branch workflow to maintain stability on the production branch while facilitating collaborative development:

```mermaid
gitGraph
    commit id: "Initial commit"
    branch develop
    checkout develop
    commit id: "chore: init develop"
    branch feature/routing
    checkout feature/routing
    commit id: "feat: add react-router-dom"
    commit id: "feat: add protected routes"
    checkout develop
    merge feature/routing
    branch feature/prompt-engineering
    checkout feature/prompt-engineering
    commit id: "feat: add few-shot prompt"
    checkout develop
    merge feature/prompt-engineering
    checkout main
    merge develop id: "release: v1.3.0" tag: "v1.3.0"
```

### Branch Naming Conventions:
- `main` — Production-ready code. Protected against direct pushes.
- `develop` — Active integration branch for upcoming releases.
- `feature/<short-description>` — New feature development (e.g., `feature/client-routing`, `feature/ai-scoring`).
- `bugfix/<short-description>` — Bug fixes (e.g., `bugfix/auth-token-refresh`).
- `docs/<short-description>` — Documentation updates (e.g., `docs/git-workflow`).

---

## 2. Commit Message Conventions (Conventional Commits)

Every commit must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description in present tense>

[optional body explaining motivation and details]

[optional footer with issue reference, e.g. Closes #42]
```

### Supported Types:
| Type | Purpose | Example |
|:---|:---|:---|
| `feat` | Introduces a new feature | `feat: implement client-side routing with react-router-dom` |
| `fix` | Patches a bug | `fix: resolve race condition in useEffect data fetch` |
| `docs` | Documentation changes | `docs: add problem modeling domain architecture guide` |
| `refactor` | Code restructuring without feature change | `refactor: extract compound Card and Modal components` |
| `test` | Adding or updating tests | `test: add event loop microtask vs macrotask assertions` |
| `chore` | Build tasks, configs, dependencies | `chore: update dependencies in client package.json` |

---

## 3. Pull Request & Code Review Lifecycle

1. **Branch Out:** Always branch out from `develop` (`git checkout -b feature/my-feature develop`).
2. **Atomic Commits:** Make small, logical, well-described commits.
3. **Open PR:** Submit a Pull Request targeting `develop` using `.github/pull_request_template.md`.
4. **Mandatory Checklist:** Ensure all mandatory concepts are checked off.
5. **Peer Review & CI:** Automated checks (`npm run build`, linting) must pass before squash-and-merge.
