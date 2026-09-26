/**
 * Stack DNA Service
 * 
 * Computes a developer's multi-dimensional skill topology across 6 pillars:
 * 1. Frontend & UI
 * 2. Backend & APIs
 * 3. Database & Storage
 * 4. Cloud & DevOps
 * 5. AI & Machine Learning
 * 6. Systems & Performance
 * 
 * Data synthesized from:
 * - User's declared stack
 * - Bookmarked issues (stacks and repo languages)
 * - Tracked contributions (planned, submitted, merged)
 * - Experience level multiplier
 */

const PILLARS = [
    { key: "frontend", label: "Frontend & UI", color: "#2D6A4F", secondaryColor: "#52B788" },
    { key: "backend", label: "Backend & APIs", color: "#1D4ED8", secondaryColor: "#60A5FA" },
    { key: "database", label: "Data & Storage", color: "#B45309", secondaryColor: "#FBBF24" },
    { key: "devops", label: "Cloud & DevOps", color: "#0F766E", secondaryColor: "#2DD4BF" },
    { key: "ai", label: "AI & Machine Learning", color: "#6D28D9", secondaryColor: "#A78BFA" },
    { key: "systems", label: "Systems & Core", color: "#BE123C", secondaryColor: "#FB7185" },
];

const SKILL_MAP = {
    // Frontend
    react: { pillar: "frontend", name: "React" },
    vue: { pillar: "frontend", name: "Vue" },
    svelte: { pillar: "frontend", name: "Svelte" },
    angular: { pillar: "frontend", name: "Angular" },
    "next.js": { pillar: "frontend", name: "Next.js", secondary: "backend" },
    nextjs: { pillar: "frontend", name: "Next.js", secondary: "backend" },
    tailwind: { pillar: "frontend", name: "Tailwind CSS" },
    css: { pillar: "frontend", name: "CSS" },
    html: { pillar: "frontend", name: "HTML" },
    javascript: { pillar: "frontend", name: "JavaScript", secondary: "backend" },
    typescript: { pillar: "frontend", name: "TypeScript", secondary: "backend" },
    redux: { pillar: "frontend", name: "Redux" },
    vite: { pillar: "frontend", name: "Vite" },
    web: { pillar: "frontend", name: "Web Platform" },

    // Backend
    "node.js": { pillar: "backend", name: "Node.js" },
    nodejs: { pillar: "backend", name: "Node.js" },
    express: { pillar: "backend", name: "Express" },
    nest: { pillar: "backend", name: "NestJS" },
    nestjs: { pillar: "backend", name: "NestJS" },
    python: { pillar: "backend", name: "Python", secondary: "ai" },
    django: { pillar: "backend", name: "Django" },
    flask: { pillar: "backend", name: "Flask" },
    fastapi: { pillar: "backend", name: "FastAPI", secondary: "ai" },
    go: { pillar: "backend", name: "Go", secondary: "systems" },
    golang: { pillar: "backend", name: "Go", secondary: "systems" },
    rust: { pillar: "systems", name: "Rust", secondary: "backend" },
    java: { pillar: "backend", name: "Java" },
    spring: { pillar: "backend", name: "Spring Boot" },
    ruby: { pillar: "backend", name: "Ruby" },
    rails: { pillar: "backend", name: "Ruby on Rails" },
    php: { pillar: "backend", name: "PHP" },
    graphql: { pillar: "backend", name: "GraphQL" },
    api: { pillar: "backend", name: "REST APIs" },

    // Database
    mongodb: { pillar: "database", name: "MongoDB" },
    postgresql: { pillar: "database", name: "PostgreSQL" },
    postgres: { pillar: "database", name: "PostgreSQL" },
    mysql: { pillar: "database", name: "MySQL" },
    sqlite: { pillar: "database", name: "SQLite" },
    redis: { pillar: "database", name: "Redis", secondary: "backend" },
    sql: { pillar: "database", name: "SQL" },
    prisma: { pillar: "database", name: "Prisma", secondary: "backend" },
    elasticsearch: { pillar: "database", name: "Elasticsearch" },

    // DevOps
    docker: { pillar: "devops", name: "Docker" },
    kubernetes: { pillar: "devops", name: "Kubernetes" },
    k8s: { pillar: "devops", name: "Kubernetes" },
    aws: { pillar: "devops", name: "AWS" },
    azure: { pillar: "devops", name: "Azure" },
    gcp: { pillar: "devops", name: "GCP" },
    linux: { pillar: "devops", name: "Linux", secondary: "systems" },
    "ci/cd": { pillar: "devops", name: "CI/CD" },
    "github-actions": { pillar: "devops", name: "GitHub Actions" },
    terraform: { pillar: "devops", name: "Terraform" },
    nginx: { pillar: "devops", name: "Nginx" },
    git: { pillar: "devops", name: "Git & VCS" },

    // AI & ML
    "machine-learning": { pillar: "ai", name: "Machine Learning" },
    ml: { pillar: "ai", name: "Machine Learning" },
    ai: { pillar: "ai", name: "Artificial Intelligence" },
    "deep-learning": { pillar: "ai", name: "Deep Learning" },
    pytorch: { pillar: "ai", name: "PyTorch" },
    tensorflow: { pillar: "ai", name: "TensorFlow" },
    rag: { pillar: "ai", name: "RAG & Vector Search" },
    gemini: { pillar: "ai", name: "Gemini AI" },
    openai: { pillar: "ai", name: "OpenAI / LLMs" },
    langchain: { pillar: "ai", name: "LangChain" },
    llm: { pillar: "ai", name: "Large Language Models" },

    // Systems
    "c++": { pillar: "systems", name: "C++" },
    cpp: { pillar: "systems", name: "C++" },
    c: { pillar: "systems", name: "C" },
    assembly: { pillar: "systems", name: "Assembly" },
    kernel: { pillar: "systems", name: "Kernel & OS" },
    wasm: { pillar: "systems", name: "WebAssembly", secondary: "frontend" },
    performance: { pillar: "systems", name: "Performance Optimization" },
};

export function calculateStackDna(user) {
    if (!user) {
        return createEmptyDna();
    }

    // Baseline points per pillar (guarantees visible, organic polygon)
    const points = {
        frontend: 20,
        backend: 20,
        database: 15,
        devops: 15,
        ai: 15,
        systems: 15,
    };

    const pillarSkills = {
        frontend: new Set(),
        backend: new Set(),
        database: new Set(),
        devops: new Set(),
        ai: new Set(),
        systems: new Set(),
    };

    // 1. Process declared stack (+28 pts primary, +12 secondary)
    const userStack = Array.isArray(user.stack) ? user.stack : [];
    userStack.forEach((rawItem) => {
        const item = String(rawItem || "").toLowerCase().trim();
        const def = SKILL_MAP[item];
        if (def) {
            points[def.pillar] = (points[def.pillar] || 0) + 28;
            pillarSkills[def.pillar].add(def.name);
            if (def.secondary && points[def.secondary]) {
                points[def.secondary] += 12;
                pillarSkills[def.secondary].add(def.name);
            }
        } else {
            // General heuristic fallback
            if (/react|vue|css|html|ui|design|front/i.test(item)) {
                points.frontend += 20;
                pillarSkills.frontend.add(rawItem);
            } else if (/db|mongo|sql|data/i.test(item)) {
                points.database += 20;
                pillarSkills.database.add(rawItem);
            } else {
                points.backend += 20;
                pillarSkills.backend.add(rawItem);
            }
        }
    });

    // 2. Process Bookmarks (issue stacks + repo language)
    const bookmarks = Array.isArray(user.bookmarks) ? user.bookmarks : [];
    bookmarks.forEach((bm) => {
        if (!bm || typeof bm !== "object") return;

        // Process issue stacks
        if (Array.isArray(bm.stacks)) {
            bm.stacks.forEach((s) => {
                const norm = String(s || "").toLowerCase().trim();
                const def = SKILL_MAP[norm];
                if (def) {
                    points[def.pillar] = (points[def.pillar] || 0) + 8;
                    pillarSkills[def.pillar].add(def.name);
                }
            });
        }

        // Process repo language
        const lang = String(bm.repo?.language || "").toLowerCase().trim();
        if (lang) {
            const def = SKILL_MAP[lang];
            if (def) {
                points[def.pillar] = (points[def.pillar] || 0) + 6;
                pillarSkills[def.pillar].add(def.name);
            }
        }
    });

    // 3. Process Tracked Contributions (high value!)
    const contributions = Array.isArray(user.contributions) ? user.contributions : [];
    contributions.forEach((contrib) => {
        if (!contrib) return;
        const multiplier = contrib.status === "merged" ? 35 : contrib.status === "submitted" ? 20 : 12;
        const textSample = `${contrib.repoName || ""} ${contrib.issueTitle || ""}`.toLowerCase();

        // Detect tech in title/repo
        let detected = false;
        Object.entries(SKILL_MAP).forEach(([key, def]) => {
            if (textSample.includes(key)) {
                points[def.pillar] = (points[def.pillar] || 0) + multiplier;
                pillarSkills[def.pillar].add(def.name);
                detected = true;
            }
        });

        if (!detected) {
            // General contribution boost to backend & frontend
            points.backend += Math.floor(multiplier * 0.6);
            points.frontend += Math.floor(multiplier * 0.4);
        }
    });

    // 4. Experience Multiplier
    const expTier = user.experienceLevel || "beginner";
    const expMultiplier = expTier === "advanced" ? 1.3 : expTier === "intermediate" ? 1.15 : 1.0;

    // 5. Final Normalization to 10-100 range
    const categories = PILLARS.map((pillar) => {
        const raw = points[pillar.key] || 15;
        const scaled = Math.min(100, Math.max(15, Math.round(raw * expMultiplier)));
        return {
            key: pillar.key,
            label: pillar.label,
            color: pillar.color,
            secondaryColor: pillar.secondaryColor,
            score: scaled,
            topSkills: Array.from(pillarSkills[pillar.key]).slice(0, 4),
        };
    });

    // Sort to determine dominance
    const sorted = [...categories].sort((a, b) => b.score - a.score);
    const topPillar = sorted[0];
    const secondPillar = sorted[1];

    // Determine Archetype
    let archetype = "Polyglot Open Source Builder";
    let description = "Balanced versatile contributor across multiple tiers of modern computing.";

    if (topPillar.score >= 60 && secondPillar.score >= 55) {
        if ((topPillar.key === "frontend" && secondPillar.key === "backend") || (topPillar.key === "backend" && secondPillar.key === "frontend")) {
            archetype = "Full-Stack Product Architect";
            description = "Seamlessly bridges polished browser interfaces with robust API server backends.";
        } else if (topPillar.key === "ai" || secondPillar.key === "ai") {
            archetype = "Applied AI Systems Specialist";
            description = "Combines generative AI models and semantic vectors with modern software architectures.";
        } else if (topPillar.key === "devops" || secondPillar.key === "devops") {
            archetype = "Cloud-Native Platform Engineer";
            description = "Specializes in scalable deployment pipelines, containerization, and infrastructure reliability.";
        } else if (topPillar.key === "systems" || secondPillar.key === "systems") {
            archetype = "High-Performance Systems Engineer";
            description = "Focused on bare-metal efficiency, memory safety, and low-latency system runtimes.";
        }
    } else if (topPillar.key === "frontend") {
        archetype = "Frontend Experience Engineer";
        description = "Crafts intuitive, responsive user experiences with dynamic visual craftsmanship.";
    } else if (topPillar.key === "backend") {
        archetype = "Distributed Backend Specialist";
        description = "Designs resilient data pipelines, robust APIs, and server-side business logic.";
    } else if (topPillar.key === "database") {
        archetype = "Data & Persistence Specialist";
        description = "Expert in schema modeling, indexing strategies, and database query optimization.";
    }

    // Dynamic Growth Recommendation
    const lowestPillar = sorted[sorted.length - 1];
    const growthRecommendation = `Your profile shows high mastery in ${topPillar.label} (${topPillar.score}%). Exploring issues with ${lowestPillar.label} labels will broaden your open-source DNA into an all-around architectural leader.`;

    const overallScore = Math.round(categories.reduce((acc, c) => acc + c.score, 0) / categories.length);

    return {
        categories,
        archetype,
        description,
        overallScore,
        topPillars: [topPillar.label, secondPillar.label],
        growthRecommendation,
        totalTrackedSkills: Object.values(pillarSkills).reduce((acc, set) => acc + set.size, 0),
    };
}

function createEmptyDna() {
    return {
        categories: PILLARS.map((p) => ({
            key: p.key,
            label: p.label,
            color: p.color,
            secondaryColor: p.secondaryColor,
            score: 25,
            topSkills: [],
        })),
        archetype: "Emerging Developer",
        description: "Set up your stack in settings to generate your verified developer DNA.",
        overallScore: 25,
        topPillars: ["Frontend & UI", "Backend & APIs"],
        growthRecommendation: "Select your active tech stack in settings to begin analyzing your skill topology.",
        totalTrackedSkills: 0,
    };
}
