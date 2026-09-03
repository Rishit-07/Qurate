import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { wrapUntrustedInput } from "./promptDefenseService.js";

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
    if (!process.env.GEMINI_API_KEY) {
        return {
            agentGoal: "Generate Step-by-Step Contribution Roadmap",
            stepsExecuted: [
                { step: 1, action: "Analyzed issue description and requirements" },
                { step: 2, action: "Evaluated developer stack match" },
                { step: 3, action: "Generated local contribution plan" },
            ],
            contributionPlan: {
                title: `Contribution Guide for ${issue.title}`,
                steps: [
                    "Clone the repository and install dependencies",
                    "Locate files relevant to the issue labels",
                    "Implement the fix or enhancement",
                    "Test locally and submit PR",
                ],
                recommendedBranch: `fix/issue-${issue.github_id || "contrib"}`,
            },
            toolCallsMade: [],
        };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        tools: [{ functionDeclarations: toolDeclarations }],
    });

    const chat = model.startChat();
    const safeIssue = wrapUntrustedInput(JSON.stringify(issue), "issue_details");
    const safeUser = wrapUntrustedInput(JSON.stringify(user), "user_profile");

    const initialPrompt = `You are the Qurate Multi-Step Contribution Agent.
Goal: Formulate a comprehensive, actionable PR Contribution Roadmap for this developer to solve this issue.
Use the available tools to inspect the repository stack, guidelines, and readiness checklist before providing the final plan.

Issue Details:
${safeIssue}

Developer Profile:
${safeUser}`;

    let response = await chat.sendMessage(initialPrompt);
    const toolCallsMade = [];
    const executionTrace = [];
    let stepCount = 1;

    // Multi-Step loop: while the model requests tool calls, execute them and return results
    while (response.functionCalls && response.functionCalls.length > 0 && stepCount <= 4) {
        for (const call of response.functionCalls) {
            executionTrace.push({
                step: stepCount,
                tool: call.name,
                arguments: call.args,
                timestamp: new Date().toISOString(),
            });

            const toolResult = await executeTool(call.name, call.args);
            toolCallsMade.push({
                tool: call.name,
                args: call.args,
                result: toolResult,
            });

            // Send tool result back to model
            response = await chat.sendMessage([
                {
                    functionResponse: {
                        name: call.name,
                        response: toolResult,
                    },
                },
            ]);
            stepCount++;
        }
    }

    return {
        agentGoal: `Autonomous Contribution Roadmap for ${issue.title}`,
        executionTrace,
        toolCallsMade,
        finalReport: response.text(),
        totalSteps: stepCount - 1,
    };
};
