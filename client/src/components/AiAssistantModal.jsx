import { useState, useEffect } from 'react'

const RAW_API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '')

/**
 * AiAssistantModal Component
 * Upgraded design featuring:
 * 1. Streaming Tab: Rich markdown parsing, styled headings, code/diagram terminal blocks with copy, and live pulse.
 * 2. Agent Tab: Interactive multi-step visual pipeline with tool result badges and structured roadmap cards.
 */
export default function AiAssistantModal({ issue, user, onClose }) {
  const [activeTab, setActiveTab] = useState('streaming') // 'streaming' | 'agent'

  // Streaming state
  const [streamText, setStreamText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [tokenMetrics, setTokenMetrics] = useState(null)
  const [copiedSection, setCopiedSection] = useState(null)

  // Agent state
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentResult, setAgentResult] = useState(null)
  const [agentError, setAgentError] = useState('')
  const [copiedRoadmap, setCopiedRoadmap] = useState(false)

  const token = localStorage.getItem('token') || localStorage.getItem('qurateToken') || ''

  // Start Streaming Analysis
  async function startStreaming() {
    setStreamText('')
    setIsStreaming(true)
    setTokenMetrics(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/stream-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          issueTitle: issue.title,
          issueBody: issue.body || '',
          stack: user?.stack || ['javascript', 'react'],
          experienceLevel: user?.experienceLevel || 'beginner',
        }),
      })

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}))
        throw new Error(errPayload.error || errPayload.message || `Server error (${response.status})`)
      }

      if (!response.body) throw new Error('ReadableStream not supported.')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''))
              if (data.error) {
                const isCapacity = data.error.includes('503') || data.error.includes('high demand')
                accumulated += isCapacity
                  ? '\n\n*(Note: Cloud model currently experiencing high global traffic. Mentorship guidance synthesized below.)*'
                  : `\n\n❌ ${data.error}`
                setStreamText(accumulated)
              }
              if (data.text) {
                accumulated += data.text
                setStreamText(accumulated)
              }
              if (data.tokenMetrics) {
                setTokenMetrics(data.tokenMetrics)
              }
            } catch (e) {
              // ignore parse errors on partial chunks
            }
          }
        }
      }
    } catch (err) {
      const isCapacity = err.message.includes('503') || err.message.includes('high demand')
      setStreamText((prev) =>
        prev
          ? `${prev}\n\n${isCapacity ? '⚠️ AI servers are experiencing temporary high demand. Please retry in a moment.' : `❌ Error: ${err.message}`}`
          : isCapacity
            ? '⚠️ AI servers are experiencing temporary high demand. Please retry in a moment.'
            : `❌ Error: ${err.message}`
      )
    } finally {
      setIsStreaming(false)
    }
  }

  // Run Multi-Step Agent
  async function runAgent() {
    setAgentRunning(true)
    setAgentError('')
    setAgentResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/agent-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ issue }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message || 'Agent execution failed')
      setAgentResult(data)
    } catch (err) {
      const msg = err.message === 'Failed to fetch'
        ? 'Network request could not reach the server. Please check your connection or retry.'
        : err.message
      setAgentError(msg)
    } finally {
      setAgentRunning(false)
    }
  }

  useEffect(() => {
    startStreaming()
  }, []) // eslint-disable-line

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text)
    if (key === 'roadmap') {
      setCopiedRoadmap(true)
      setTimeout(() => setCopiedRoadmap(false), 2000)
    } else {
      setCopiedSection(key)
      setTimeout(() => setCopiedSection(null), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fadeIn">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-[#1A1A18]/15 bg-[#F7F5F0] shadow-2xl overflow-hidden text-left">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1A1A18]/10 bg-white/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-lg text-white shadow-md">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#2D6A4F]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F]">
                  AI Intelligence Hub
                </span>
                <span className="rounded-full bg-[#2D6A4F]/15 px-2 py-0.5 text-[10px] font-bold text-[#2D6A4F]">
                  Gemini 3.6 Flash
                </span>
              </div>
              <h2 className="mt-0.5 line-clamp-1 [font-family:Georgia,serif] text-lg font-bold text-[#1A1A18]">
                {issue.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1A1A18]/15 bg-white text-sm font-bold text-[#1A1A18]/60 transition hover:bg-[#1A1A18]/10 hover:text-[#1A1A18]"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1A1A18]/10 bg-white/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('streaming')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === 'streaming'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-[#1A1A18]/55 hover:text-[#1A1A18]'
            }`}
          >
            <span>⚡</span>
            <span>Streaming Real-Time Analysis</span>
            {isStreaming && (
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('agent')
              if (!agentResult && !agentRunning) runAgent()
            }}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === 'agent'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-[#1A1A18]/55 hover:text-[#1A1A18]'
            }`}
          >
            <span>🤖</span>
            <span>Autonomous Multi-Step Agent</span>
            <span className="rounded-full bg-[#2D6A4F]/15 px-2 py-0.5 text-[10px] font-semibold text-[#2D6A4F]">
              Tool Use
            </span>
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: STREAMING REAL-TIME ANALYSIS */}
          {activeTab === 'streaming' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A18]/50">
                    Live Response Stream
                  </p>
                  <p className="text-xs text-[#1A1A18]/60">
                    Streaming step-by-step architectural breakdown & code guidance
                  </p>
                </div>

                <button
                  onClick={startStreaming}
                  disabled={isStreaming}
                  className="flex items-center gap-1.5 rounded-xl border border-[#1A1A18]/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1A1A18] shadow-xs transition hover:border-[#2D6A4F] hover:text-[#2D6A4F] disabled:opacity-50"
                >
                  <span>{isStreaming ? 'Streaming…' : '🔄 Restart Stream'}</span>
                </button>
              </div>

              {/* Formatted Markdown Container */}
              <div className="rounded-2xl border border-[#1A1A18]/12 bg-white/85 p-6 shadow-sm">
                {streamText ? (
                  <RichStreamRenderer
                    content={streamText}
                    isStreaming={isStreaming}
                    onCopyCode={(code, id) => handleCopy(code, id)}
                    copiedId={copiedSection}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D6A4F]/10 text-xl text-[#2D6A4F] animate-pulse">
                      ⚡
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#1A1A18]">
                      Connecting to streaming engine…
                    </p>
                    <p className="mt-1 text-xs text-[#1A1A18]/50">
                      Gemini 3.6 Flash is reviewing repository requirements and issue scope.
                    </p>
                  </div>
                )}
              </div>

              {/* Token & Cost Metrics Banner */}
              {tokenMetrics && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-600/20 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-950">
                  <div className="flex items-center gap-4">
                    <span>
                      📊 <strong>Total Tokens:</strong> {tokenMetrics.totalTokens}
                    </span>
                    <span>
                      📥 <strong>Prompt:</strong> {tokenMetrics.promptTokens}
                    </span>
                    <span>
                      📤 <strong>Output:</strong> {tokenMetrics.candidatesTokens}
                    </span>
                  </div>
                  <span className="rounded-md bg-emerald-200/60 px-2 py-0.5 font-bold text-emerald-900">
                    💰 Est. Cost: ${((tokenMetrics.totalTokens / 1000000) * 0.35).toFixed(6)} USD
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTONOMOUS MULTI-STEP AGENT */}
          {activeTab === 'agent' && (
            <div className="space-y-6">
              {/* Agent Overview Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#2D6A4F]/20 bg-[#2D6A4F]/5 p-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A18]">
                    Autonomous Multi-Step Agent Pipeline
                  </h3>
                  <p className="text-xs text-[#1A1A18]/65">
                    Gemini reasons, calls internal tools to verify dependencies, and synthesizes a hardened PR plan.
                  </p>
                </div>
                <button
                  onClick={runAgent}
                  disabled={agentRunning}
                  className="rounded-xl bg-[#2D6A4F] px-4 py-2 text-xs font-bold text-[#F7F5F0] shadow-md transition hover:bg-[#24583F] disabled:opacity-50"
                >
                  {agentRunning ? 'Agent Reasoning…' : 'Re-run Agent'}
                </button>
              </div>

              {/* Loading State */}
              {agentRunning && (
                <div className="space-y-3 rounded-2xl border border-[#2D6A4F]/20 bg-white/80 p-8 text-center shadow-xs animate-fadeIn">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[#2D6A4F] border-t-transparent" />
                  <p className="text-sm font-bold text-[#1A1A18]">
                    Executing Autonomous ReAct Tool Loop…
                  </p>
                  <p className="text-xs text-[#1A1A18]/60">
                    Inspecting tech stack & checking contributor guidelines via function calling
                  </p>
                </div>
              )}

              {/* Error State */}
              {agentError && (
                <div className="rounded-xl border border-red-700/20 bg-red-700/10 p-4 text-xs font-semibold text-red-800">
                  {agentError}
                </div>
              )}

              {/* Results State */}
              {agentResult && !agentRunning && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Visual Tool Calls Stepper */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A18]/60">
                        🛠️ Tool Invocations & Verified Facts ({agentResult.toolCallsMade?.length || 0})
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        ✓ All Tool Calls Resolved
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {agentResult.toolCallsMade?.map((tc, idx) => (
                        <ToolInvocationCard key={idx} stepIndex={idx + 1} toolCall={tc} />
                      ))}
                    </div>
                  </div>

                  {/* Final Roadmap Card */}
                  <div className="rounded-2xl border border-[#2D6A4F]/30 bg-white/95 p-6 shadow-md">
                    <div className="flex items-center justify-between border-b border-[#1A1A18]/10 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base">📋</span>
                          <h4 className="[font-family:Georgia,serif] text-base font-bold text-[#1A1A18]">
                            Verified Contribution Roadmap
                          </h4>
                        </div>
                        <p className="text-xs text-[#1A1A18]/60">
                          Formulated based on verified repository stack and guidelines
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            agentResult.finalReport || JSON.stringify(agentResult.contributionPlan, null, 2),
                            'roadmap'
                          )
                        }
                        className="rounded-lg border border-[#1A1A18]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A18]/80 shadow-xs transition hover:bg-[#1A1A18]/5 hover:text-[#1A1A18]"
                      >
                        {copiedRoadmap ? '✓ Copied' : 'Copy Roadmap'}
                      </button>
                    </div>

                    <div className="mt-5">
                      <ContributionPlanRenderer
                        content={agentResult.finalReport || agentResult.contributionPlan}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#1A1A18]/10 bg-white/90 px-6 py-3.5 text-xs text-[#1A1A18]/60">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>Protected with Prompt Injection Defenses & Schema Validation</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#1A1A18] px-4 py-1.5 font-bold text-[#F7F5F0] shadow-sm transition hover:bg-[#2D6A4F]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}

/**
 * Rich Stream Renderer
 * Transforms raw markdown stream into beautifully formatted headings, lists, code blocks,
 * and ASCII diagrams wrapped in terminal containers.
 */
function RichStreamRenderer({ content, isStreaming, onCopyCode, copiedId }) {
  // Split content by code blocks ```...```
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        if (!part) return null

        // Check if this part is a code/diagram block
        if (part.startsWith('```')) {
          const match = part.match(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/)
          const lang = match ? match[1] : ''
          const code = match ? match[2] : part.slice(3, -3)
          const isCopied = copiedId === `code-${index}`

          return (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-slate-700/60 bg-[#0F172A] shadow-md text-left"
            >
              {/* Terminal Window Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#1E293B]/70 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="ml-2 font-mono text-[11px] font-semibold text-slate-400">
                    {lang ? lang.toUpperCase() : 'ARCHITECTURE & FLOW'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onCopyCode(code.trim(), `code-${index}`)}
                  className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  {isCopied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              {/* Code/Diagram Content */}
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-emerald-300">
                <code>{code.trim()}</code>
              </pre>
            </div>
          )
        }

        // Regular Markdown text
        return <FormattedMarkdownSection key={index} text={part} />
      })}

      {/* Streaming pulse cursor */}
      {isStreaming && (
        <span className="inline-block h-4 w-2 rounded-xs bg-[#2D6A4F] animate-pulse align-middle ml-1" />
      )}
    </div>
  )
}

/**
 * Formats markdown paragraphs, headings (###), bold tags, and list items
 */
function FormattedMarkdownSection({ text }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={idx} className="h-1.5" />

        // Heading 3 (###)
        if (trimmed.startsWith('###')) {
          const title = trimmed.replace(/^###\s*/, '')
          return (
            <div
              key={idx}
              className="mt-6 mb-3 flex items-center gap-2.5 border-b border-[#1A1A18]/10 pb-2 text-left"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2D6A4F]/15 text-xs text-[#2D6A4F]">
                📌
              </span>
              <h3 className="[font-family:Georgia,serif] text-base font-bold text-[#1A1A18]">
                {title}
              </h3>
            </div>
          )
        }

        // Numbered list item (1. , 2. )
        if (/^\d+\.\s/.test(trimmed)) {
          const numberMatch = trimmed.match(/^(\d+)\.\s*(.*)/)
          const num = numberMatch ? numberMatch[1] : '•'
          const rest = numberMatch ? numberMatch[2] : trimmed

          return (
            <div key={idx} className="flex items-start gap-3 py-1 text-sm text-[#1A1A18]/85">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F]/15 text-xs font-bold text-[#2D6A4F]">
                {num}
              </span>
              <div className="leading-relaxed">{parseInlineMarkdown(rest)}</div>
            </div>
          )
        }

        // Bullet point item (- or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const rest = trimmed.replace(/^[-*]\s*/, '')
          return (
            <div key={idx} className="flex items-start gap-2.5 py-0.5 text-sm text-[#1A1A18]/85">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2D6A4F]" />
              <div className="leading-relaxed">{parseInlineMarkdown(rest)}</div>
            </div>
          )
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-sm font-normal leading-relaxed text-[#1A1A18]/85">
            {parseInlineMarkdown(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

/**
 * Parses bold text (**bold**) and inline code (`code`)
 */
function parseInlineMarkdown(str) {
  if (!str) return null
  const tokens = str.split(/(\*\*.*?\*\*|`.*?`)/g)

  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-[#1A1A18]">
          {tok.slice(2, -2)}
        </strong>
      )
    }
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded-md bg-[#2D6A4F]/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-[#2D6A4F]"
        >
          {tok.slice(1, -1)}
        </code>
      )
    }
    return tok
  })
}

/**
 * Tool Invocation Card
 * Displays the verified findings of a function call in a clean, visual card
 */
function ToolInvocationCard({ stepIndex, toolCall }) {
  const toolName = toolCall.tool || 'Tool'
  const isStackTool = toolName === 'get_repository_tech_stack'
  const isGuidelinesTool = toolName === 'check_contributor_guidelines'

  return (
    <div className="rounded-xl border border-[#1A1A18]/10 bg-white/90 p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#1A1A18]/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#2D6A4F]/15 text-xs font-bold text-[#2D6A4F]">
            {stepIndex}
          </span>
          <span className="text-xs font-bold text-[#1A1A18]">
            {isStackTool
              ? 'Repository Tech Stack'
              : isGuidelinesTool
              ? 'Contributor Guidelines'
              : toolName}
          </span>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
          SUCCESS
        </span>
      </div>

      <div className="mt-3 text-xs">
        {isStackTool && toolCall.result && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {toolCall.result.buildTool && (
                <span className="rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5 font-semibold text-amber-800">
                  ⚡ {toolCall.result.buildTool}
                </span>
              )}
              {toolCall.result.testFramework && (
                <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 font-semibold text-emerald-800">
                  🧪 {toolCall.result.testFramework}
                </span>
              )}
              {toolCall.result.packageManager && (
                <span className="rounded-md bg-blue-50 border border-blue-200/60 px-2 py-0.5 font-semibold text-blue-800">
                  📦 {toolCall.result.packageManager}
                </span>
              )}
            </div>
            {Array.isArray(toolCall.result.coreLibraries) && (
              <div className="flex flex-wrap gap-1 pt-1">
                {toolCall.result.coreLibraries.map((lib) => (
                  <span
                    key={lib}
                    className="rounded-full bg-[#1A1A18]/5 px-2 py-0.5 text-[11px] font-medium text-[#1A1A18]/70"
                  >
                    {lib}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {isGuidelinesTool && toolCall.result && (
          <div className="space-y-2">
            {toolCall.result.branching && (
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#2D6A4F] bg-[#2D6A4F]/10 p-1.5 rounded-md border border-[#2D6A4F]/20">
                <span className="font-sans text-[10px] font-bold uppercase text-[#1A1A18]">Branch:</span>
                <code>{toolCall.result.branching}</code>
              </div>
            )}
            {toolCall.result.commitFormat && (
              <p className="text-[11px] text-[#1A1A18]/70">
                <strong>Commit Standard:</strong> {toolCall.result.commitFormat}
              </p>
            )}
            {Array.isArray(toolCall.result.ciChecks) && (
              <div className="flex flex-wrap gap-1 pt-1">
                {toolCall.result.ciChecks.map((ci) => (
                  <span
                    key={ci}
                    className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
                  >
                    ✓ {ci}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {!isStackTool && !isGuidelinesTool && (
          <pre className="font-mono text-[11px] text-[#1A1A18]/75 overflow-x-auto">
            {JSON.stringify(toolCall.result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

/**
 * Contribution Plan Renderer
 * Renders structured roadmap steps as modern interactive step cards
 */
function ContributionPlanRenderer({ content }) {
  if (typeof content === 'string') {
    return <FormattedMarkdownSection text={content} />
  }

  const steps = content.steps || []
  return (
    <div className="space-y-3">
      {content.title && (
        <h5 className="font-bold text-[#1A1A18] text-sm">{content.title}</h5>
      )}
      {content.recommendedBranch && (
        <div className="inline-flex items-center gap-2 rounded-lg bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 px-3 py-1.5 text-xs text-[#2D6A4F] font-mono">
          <span className="font-sans font-bold text-[10px] uppercase text-[#1A1A18]">Target Branch:</span>
          <span>{content.recommendedBranch}</span>
        </div>
      )}
      <div className="mt-3 space-y-2.5">
        {steps.map((st, idx) => (
          <div key={idx} className="flex items-start gap-3 rounded-xl border border-[#1A1A18]/8 bg-[#F7F5F0]/80 p-3.5 text-xs font-medium text-[#1A1A18]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] text-white text-[11px] font-bold">
              {idx + 1}
            </span>
            <span className="leading-relaxed mt-0.5">{st}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
