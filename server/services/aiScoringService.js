import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const normalizeList = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

const buildFallbackScore = (issue, user) => {
    const issueSignals = [
        ...normalizeList(issue.labels),
        ...normalizeList(issue.stacks),
        issue.repo?.language,
        issue.title,
        issue.body,
    ].join(" ").toLowerCase();

    const userStack = normalizeList(user.stack);
    const matchedSkill = userStack.find((skill) =>
        issueSignals.includes(String(skill).toLowerCase())
    );

    const sameLevel = issue.complexity === user.experienceLevel;
    const score = matchedSkill ? (sameLevel ? 8 : 7) : (sameLevel ? 5 : 3);

    return {
        score,
        reason: matchedSkill
            ? `Local match based on ${matchedSkill} while AI quota is unavailable.`
            : "Local estimate used because AI quota is unavailable.",
    };
};

const isQuotaOrRateLimitError = (error) => {
    const message = error?.message || "";
    return error?.status === 429
        || message.includes("429")
        || message.toLowerCase().includes("quota")
        || message.toLowerCase().includes("too many requests");
};

const isJsonParseError = (error) => error instanceof SyntaxError;

const parseScoreResponse = (raw) => {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
        score: Math.max(1, Math.min(10, Number(parsed.score) || 1)),
        reason: String(parsed.reason || "AI score generated.").slice(0, 160),
    };
};

export const scoreIssueForUser = async(Issue,user)=>{

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({model: GEMINI_MODEL});

    const prompt = `You are an expert developer and career advisor. You are helping a user find open source issues that are a good fit for them to contribute to. The user has the following profile:
    
    ISSUE:
    Title: ${Issue.title}
    Labels: ${normalizeList(Issue.labels).join(", ")}
    Complexity: ${Issue.complexity}
    
    DEVELOPER:
    Stack: ${normalizeList(user.stack).join(", ")}
    Experience Level: ${user.experienceLevel}
    
    RULES:
    - score must be between 0 and 10
    - reason must be under 15 words
    - reason must mention a specific skill from the developer's profile that makes the issue a good fit or not
    - do not add any fields beyond score and reason
    
    EXAMPLE OUTPUT:
    {
        "score": 8,
        "reason": "Good match because of required skill in React which the developer has."
    }
   Respond ONLY with JSON, no markdown, no explanations.`;

   try {
       const result = await model.generateContent(prompt);
       const raw = result.response.text();
       return parseScoreResponse(raw);
   } catch (error) {
       if (isQuotaOrRateLimitError(error) || isJsonParseError(error)) {
           return buildFallbackScore(Issue, user);
       }

       throw error;
   }
};
