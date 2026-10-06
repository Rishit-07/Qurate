/**
 * Groq AI Service
 * Ultra-fast inference provider (300-500 tokens/sec)
 * Uses Llama 3.3 70B Versatile with 14,400 free requests per day.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
export const CANDIDATE_GROQ_MODELS = [
    process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
];

export const isGroqAvailable = () => {
    return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 5);
};

/**
 * Generate chat completion via Groq
 */
export const generateGroqChat = async ({ messages, model = DEFAULT_GROQ_MODEL, temperature = 0.5, maxTokens = 2048 }) => {
    if (!isGroqAvailable()) {
        throw new Error("GROQ_API_KEY is not configured.");
    }

    const modelsToTry = Array.from(new Set([model, ...CANDIDATE_GROQ_MODELS]));
    let lastError = null;

    for (const m of modelsToTry) {
        try {
            const response = await fetch(GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY.trim()}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: m,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.error?.message || `Groq error (${response.status}) on model ${m}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (err) {
            lastError = err;
            console.warn(`[Groq Model Failover] ${m} notice:`, err.message);
        }
    }

    throw lastError || new Error("All Groq candidate models failed.");
};

/**
 * Stream chat completion from Groq via Server-Sent Events
 */
export const streamGroqChat = async ({ messages, model = DEFAULT_GROQ_MODEL, temperature = 0.5, maxTokens = 2048, onChunk }) => {
    if (!isGroqAvailable()) {
        throw new Error("GROQ_API_KEY is not configured.");
    }

    const modelsToTry = Array.from(new Set([model, ...CANDIDATE_GROQ_MODELS]));
    let response = null;

    for (const m of modelsToTry) {
        try {
            const res = await fetch(GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY.trim()}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: m,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                    stream: true,
                }),
            });

            if (res.ok) {
                response = res;
                break;
            }
        } catch (err) {
            console.warn(`[Groq Stream Failover] ${m} notice:`, err.message);
        }
    }

    if (!response || !response.ok) {
        throw new Error("Could not initialize Groq stream across candidate models.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const dataStr = trimmed.replace("data: ", "").trim();
            if (dataStr === "[DONE]") break;

            try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                    accumulated += delta;
                    if (onChunk) onChunk(delta);
                }
            } catch {
                // Ignore parse errors on partial chunks
            }
        }
    }

    return accumulated;
};
