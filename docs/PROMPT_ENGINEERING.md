# ✦ Prompt Engineering Architecture Guide — Qurate

**Module:** AI Issue Scoring & Autonomous Agent Pipeline  
**Curriculum Concept:** Prompt Engineering (AI App Eng • 0.2 pts)  
**LLM Engine:** Google Gemini (`gemini-3.6-flash`)

---

## 1. Executive Summary

Prompt Engineering in Qurate transforms raw unstructured GitHub issue descriptions and developer skill matrices into deterministic, calibrated recommendations. Rather than treating the LLM as an open-ended chatbot, Qurate employs **structured production prompt engineering principles** designed for accuracy, reproducibility, sub-second latency, and zero prompt injection vulnerability.

---

## 2. Core Prompt Engineering Principles

### 2.1 Persona & System Instructions
The model is constrained using Gemini's native `systemInstruction` configuration:
```javascript
systemInstruction: "You are a Senior Open-Source Tech Lead and Contributor Mentor. Your task is to evaluate GitHub open source issues against developer profiles and provide calibrated, explainable fit scores (1-10) with actionable reasons under 20 words."
```
- **Rationale:** Establishes the decision boundary, tone, and domain perspective before processing user inputs.

### 2.2 Input Delimiters & Injection Defense Wrapping
Untrusted inputs (such as issue titles, bodies, and markdown comments authored by third-party GitHub users) are enclosed in XML-style delimiters:
```
<issue_data>
Title: {{issue.title}}
Complexity: {{issue.complexity}}
Labels: {{issue.labels}}
Description: {{issue.body}}
</issue_data>

<developer_profile>
Stack: {{user.stack}}
Experience Level: {{user.experienceLevel}}
</developer_profile>
```
- **Defense Mechanism:** Input pre-sanitizers in `promptDefenseService.js` scan for jailbreak phrases (`"Ignore previous instructions"`, `"DAN mode"`, `"developer mode"`), neutralizing injection attempts before prompt generation.

### 2.3 In-Context Learning (Few-Shot Prompting)
To calibrate numeric scores (1–10) across diverse technology stacks and seniority tiers, explicit few-shot input/output pairs are embedded:
- **Positive Alignment Example:** React beginner matching a `"good first issue"` with CSS/React labels -> Score 9.
- **Negative Mismatch Example:** Python beginner evaluating a Rust async memory safety issue -> Score 2.

### 2.4 Structured JSON Schema Enforcement
Free-form text responses risk breaking downstream API consumers. Qurate binds Gemini using `responseMimeType: "application/json"` and `responseSchema`:
```json
{
  "type": "OBJECT",
  "properties": {
    "score": { "type": "INTEGER", "description": "Fit score from 1 to 10" },
    "reason": { "type": "STRING", "description": "Concise 1-sentence reason under 20 words" },
    "strengths": { "type": "ARRAY", "items": { "type": "STRING" } }
  },
  "required": ["score", "reason"]
}
```

### 2.5 Hyperparameter Tuning
- **Temperature:** `0.2` — Ensures deterministic, highly reproducible evaluations across multiple runs.
- **Max Output Tokens:** Bounded to minimize token generation latency.

### 2.6 Token Accounting & Cost Economics
Every API invocation extracts `usageMetadata`:
- **Formula:** `Cost = (PromptTokens / 1M * $0.15) + (CandidateTokens / 1M * $0.60)`
- Stored and tracked on each evaluation result.

---

## 3. Evaluation & Verification Suite
The prompt suite is tested in `server/tests/aiEval.test.js` against three benchmark suites:
1. High-affinity positive skill match calibration.
2. Cross-domain mismatch boundary score verification.
3. Prompt injection neutralization benchmark.
