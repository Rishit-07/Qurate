/**
 * Prompt Injection Defense & Sanitization Service
 * Detects and defuses common jailbreaks, system prompt overrides, and delimiter escaping attacks.
 */

// Patterns indicating potential prompt injection / jailbreak attempts
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /system\s+override/i,
    /you\s+are\s+now\s+in\s+DAN\s+mode/i,
    /developer\s+mode\s+enabled/i,
    /reveal\s+(the\s+)?(system\s+prompt|secret|api\s*key)/i,
    /disregard\s+(above|all|any)\s+rules/i,
    /bypass\s+safety\s+filter/i,
    /\badmin\s+mode\s*:\s*true/i,
    /print\s+system\s+instructions/i,
];

/**
 * Validates text against prompt injection patterns.
 * @param {string} text - User or issue text to check
 * @returns {{ isSafe: boolean, flaggedPatterns: string[] }}
 */
export const checkPromptSafety = (text) => {
    if (!text || typeof text !== "string") return { isSafe: true, flaggedPatterns: [] };

    const flagged = [];
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(text)) {
            flagged.push(pattern.toString());
        }
    }

    return {
        isSafe: flagged.length === 0,
        flaggedPatterns: flagged,
    };
};

/**
 * Sanitizes and wraps untrusted input into secure XML-style delimited tags
 * to instruct the LLM to treat content strictly as data, not system instructions.
 * @param {string} content - Untrusted input
 * @param {string} tagName - Tag name (e.g. 'untrusted_issue_data')
 * @returns {string} Safe delimited string
 */
export const wrapUntrustedInput = (content, tagName = "user_supplied_data") => {
    if (!content) return `<${tagName}>None provided</${tagName}>`;
    
    // Neutralize prompt injection indicators by defusing key phrases
    let sanitized = String(content)
        .replace(/system\s*:/gi, "system (quoted):")
        .replace(/assistant\s*:/gi, "assistant (quoted):")
        .replace(/```/g, "'''");

    return `<${tagName}>\n${sanitized}\n</${tagName}>`;
};
