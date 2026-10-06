import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { wrapUntrustedInput } from "./promptDefenseService.js";
import { isGroqAvailable, generateGroqChat } from "./groqService.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// 1. Tool / Function Declarations for Gemini Function Calling
const toolDeclarations = [
    {
        name: "get_repository_tech_stack",
        description: "Retrieves repository architecture, key configuration files, and framework dependencies.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                repoName: {
                    type: SchemaType.STRING,
                    description: "The full repository name in 'owner/repo' format",
                },
            },
            required: ["repoName"],
        },
    },
    {
        name: "check_contributor_guidelines",
        description: "Retrieves recommended PR branching strategy, testing requirements, and commit conventions for a project.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                repoName: {
                    type: SchemaType.STRING,
                    description: "The full repository name in 'owner/repo' format",
                },
            },
            required: ["repoName"],
        },
    },
    {
        name: "calculate_pr_readiness_score",
        description: "Calculates an estimated PR difficulty and required verification steps based on issue scope.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                issueType: {
                    type: SchemaType.STRING,
                    description: "Type of issue: 'bug', 'feature', 'documentation', or 'refactor'",
                },
                complexity: {
                    type: SchemaType.STRING,
                    description: "Complexity level: 'beginner', 'intermediate', or 'advanced'",
                },
            },
            required: ["issueType", "complexity"],
        },
    },
];

// 2. Simulated tool execution implementations
const executeTool = async (name, args) => {
    switch (name) {
        case "get_repository_tech_stack":
            return {
                repo: args.repoName,
                buildTool: "Vite / Webpack",
                testFramework: "Jest & React Testing Library",
                packageManager: "npm",
                coreLibraries: ["React", "Express", "Node.js", "TailwindCSS"],
            };
        case "check_contributor_guidelines":
            return {
                branching: "feature/<issue-number>-short-description",
                requiresTests: true,
                commitFormat: "Conventional Commits (e.g. fix: ... or feat: ...)",
                ciChecks: ["ESLint", "Automated Jest Tests", "Build Check"],
            };
        case "calculate_pr_readiness_score":
            return {
                estimatedHours: args.complexity === "beginner" ? "2-4 hours" : "6-12 hours",
                recommendedChecklist: [
                    "Fork and clone repository",
                    "Create isolated feature branch",
                    "Reproduce or locate relevant component",
                    "Implement minimal clean solution",
                    "Add regression unit tests",
                    "Open draft Pull Request referencing the issue",
                ],
            };
        default:
            return { error: `Tool ${name} not found.` };
    }
};

/**
 * Multi-Step Agent Runner: Executes an autonomous tool-calling loop with Gemini
 * to construct an end-to-end Contribution Roadmap for a developer on an open source issue.
 */
export const runContributionAgent = async ({ issue, user }) => {
    const repoName = issue.repo?.name || "Target Repo";
    const complexity = issue.complexity || "beginner";
    const issueType = (issue.labels || []).some(l => /bug|fix/i.test(l)) ? "bug" : "feature";

    // 1. Deterministically run agent tools
    const executionTrace = [];
    const toolCallsMade = [];

    // Step 1: Tech stack inspection
    executionTrace.push({
        step: 1,
        tool: "get_repository_tech_stack",
        arguments: { repoName },
        timestamp: new Date().toISOString(),
    });
    const stackResult = await executeTool("get_repository_tech_stack", { repoName });
    toolCallsMade.push({
        tool: "get_repository_tech_stack",
        args: { repoName },
        result: stackResult,
    });

    // Step 2: Contributor guidelines inspection
    executionTrace.push({
        step: 2,
        tool: "check_contributor_guidelines",
        arguments: { repoName },
        timestamp: new Date().toISOString(),
    });
    const guidelinesResult = await executeTool("check_contributor_guidelines", { repoName });
    toolCallsMade.push({
        tool: "check_contributor_guidelines",
        args: { repoName },
        result: guidelinesResult,
    });

    // Step 3: PR readiness calculation
    executionTrace.push({
        step: 3,
        tool: "calculate_pr_readiness_score",
        arguments: { issueType, complexity },
        timestamp: new Date().toISOString(),
    });
    const readinessResult = await executeTool("calculate_pr_readiness_score", { issueType, complexity });
    toolCallsMade.push({
        tool: "calculate_pr_readiness_score",
        args: { issueType, complexity },
        result: readinessResult,
    });

    let finalReportText = `### 🚀 Actionable PR Plan for ${issue.title}\n\n` +
        `1. **Repository Setup**: Clone repository \`${repoName}\` and install dependencies with \`npm install\`.\n` +
        `2. **Branching Strategy**: Create feature branch \`fix/issue-${issue.github_id || "contrib"}\` from \`main\`.\n` +
        `3. **Targeted Implementation**: Locate components matching labels \`${(issue.labels || []).join(", ") || "open-source"}\`. Implement targeted solution following ${guidelinesResult.commitFormat}.\n` +
        `4. **Quality Checks & PR**: Run local test suites (\`${stackResult.testFramework}\`), verify checks, and open a clean draft PR.`;

    // Synthesize final PR roadmap using Groq (Llama 3.3 70B) or Gemini
    const synthPrompt = `You are the Qurate Autonomous Contribution Agent.
Synthesize an actionable, high-impact PR Contribution Roadmap for this developer based on the gathered repository tools:

Issue: "${issue.title}"
Repository: "${repoName}"
Labels: ${(issue.labels || []).join(", ") || "open source"}
Developer Profile: Stack: ${Array.isArray(user?.stack) ? user.stack.join(", ") : "open-source"}, Level: ${user?.experienceLevel || "beginner"}

Inspected Tools:
1. Tech Stack: ${JSON.stringify(stackResult)}
2. Contributor Guidelines: ${JSON.stringify(guidelinesResult)}
3. PR Readiness & Scope: ${JSON.stringify(readinessResult)}

Format your response in structured Markdown:
### 🚀 Actionable PR Plan for ${issue.title}
1. **Environment Setup & Verification**: Specific clone and dependency installation steps.
2. **Branching & Workflow**: Branch name and commit conventions.
3. **Targeted Implementation Architecture**: Files, components, and logic to modify.
4. **Validation & PR Submission**: Testing commands and pull request submission checklist.`;

    let synthesized = false;

    if (isGroqAvailable()) {
        try {
            const groqOutput = await generateGroqChat({
                messages: [
                    { role: "system", content: "You are the Qurate Multi-Step Contribution Agent specializing in open-source engineering." },
                    { role: "user", content: synthPrompt }
                ],
            });
            if (groqOutput && groqOutput.length > 50) {
                finalReportText = groqOutput;
                synthesized = true;
            }
        } catch (groqErr) {
            console.warn("[AI Agent] Groq failover notice:", groqErr.message);
        }
    }

    if (!synthesized && process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            });

            const aiResult = await model.generateContent(synthPrompt);
            const generated = aiResult?.response?.text?.();
            if (generated) {
                finalReportText = generated;
            }
        } catch (apiErr) {
            console.warn("[AI Agent] Gemini synthesis notice (utilizing structured fallback):", apiErr.message);
        }
    }

    return {
        agentGoal: `Autonomous Contribution Roadmap for ${issue.title}`,
        executionTrace,
        toolCallsMade,
        finalReport: finalReportText,
        totalSteps: 3,
    };
};
