import { useState, useEffect } from 'react'

const RAW_API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '')

export default function AiAssistantModal({ issue, user, onClose }) {
  const [activeTab, setActiveTab] = useState('streaming') // 'streaming' | 'agent'

  // Streaming state
  const [streamText, setStreamText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [tokenMetrics, setTokenMetrics] = useState(null)

  // Agent state
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentResult, setAgentResult] = useState(null)
  const [agentError, setAgentError] = useState('')

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
                accumulated += `\n\n❌ ${data.error}`
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
      setStreamText((prev) => prev ? `${prev}\n\n❌ Error: ${err.message}` : `❌ Error: ${err.message}`)
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ issue }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message || 'Agent execution failed')
      setAgentResult(data)
    } catch (err) {
      setAgentError(err.message)
    } finally {
      setAgentRunning(false)
    }
  }

  useEffect(() => {
    startStreaming()
  }, []) // eslint-disable-line

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-[#1A1A18]/15 bg-[#F7F5F0] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1A1A18]/10 bg-white/80 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#2D6A4F]/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#2D6A4F]">
                AI Intelligence Hub
              </span>
              <span className="text-xs font-semibold text-[#1A1A18]/50">
                Gemini 3.6 Flash
              </span>
            </div>
            <h2 className="mt-1 line-clamp-1 [font-family:Georgia,serif] text-lg font-bold text-[#1A1A18]">
              {issue.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1A1A18]/15 bg-white text-sm font-bold text-[#1A1A18]/60 transition hover:bg-[#1A1A18]/5 hover:text-[#1A1A18]"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1A1A18]/10 bg-white/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('streaming')}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition ${activeTab === 'streaming'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-[#1A1A18]/55 hover:text-[#1A1A18]'
              }`}
          >
            ⚡ Streaming Real-Time Analysis
          </button>
          <button
            onClick={() => {
              setActiveTab('agent')
              if (!agentResult && !agentRunning) runAgent()
            }}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition ${activeTab === 'agent'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-[#1A1A18]/55 hover:text-[#1A1A18]'
              }`}
          >
            🤖 Autonomous Multi-Step Agent (Tool Use)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'streaming' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A18]/50">
                  Live Response Stream
                </p>
                <button
                  onClick={startStreaming}
                  disabled={isStreaming}
                  className="rounded-md border border-[#1A1A18]/15 bg-white px-3 py-1 text-xs font-semibold text-[#1A1A18] transition hover:border-[#2D6A4F] hover:text-[#2D6A4F] disabled:opacity-50"
                >
                  {isStreaming ? 'Streaming…' : '🔄 Restart Stream'}
                </button>
              </div>

              <div className="rounded-xl border border-[#1A1A18]/10 bg-white/70 p-5 shadow-inner">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#1A1A18]">
                  {streamText || (
                    <span className="flex items-center gap-2 text-sm text-[#1A1A18]/45">
                      <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[#2D6A4F]" />
                      Connecting to streaming engine and analyzing issue context…
                    </span>
                  )}
                </div>
              </div>

              {tokenMetrics && (
                <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#2D6A4F]/20 bg-[#2D6A4F]/5 px-4 py-3 text-xs font-medium text-[#2D6A4F]">
                  <span>📊 <strong>Total Tokens:</strong> {tokenMetrics.totalTokens}</span>
                  <span>📥 <strong>Prompt Tokens:</strong> {tokenMetrics.promptTokens}</span>
                  <span>📤 <strong>Output Tokens:</strong> {tokenMetrics.candidatesTokens}</span>
                  <span>💰 <strong>Est. Cost:</strong> ${((tokenMetrics.totalTokens / 1000000) * 0.35).toFixed(6)} USD</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A18]">Multi-Step Autonomous Agent Workflow</h3>
                  <p className="text-xs text-[#1A1A18]/60">Gemini agent uses function calling to inspect repository tech stack, contributor guidelines, and readiness checklist.</p>
                </div>
                <button
                  onClick={runAgent}
                  disabled={agentRunning}
                  className="rounded-md bg-[#2D6A4F] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#24583F] disabled:opacity-50"
                >
                  {agentRunning ? 'Executing Agent…' : 'Run Agent'}
                </button>
              </div>

              {agentRunning && (
                <div className="space-y-3 rounded-xl border border-[#1A1A18]/10 bg-white/70 p-6 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#2D6A4F] border-t-transparent" />
                  <p className="text-sm font-semibold text-[#1A1A18]">Agent is running autonomous tool calls…</p>
                  <p className="text-xs text-[#1A1A18]/55">Calling `get_repository_tech_stack` & `check_contributor_guidelines`...</p>
                </div>
              )}

              {agentError && (
                <div className="rounded-lg border border-red-700/20 bg-red-700/10 p-4 text-xs font-semibold text-red-800">
                  {agentError}
                </div>
              )}

              {agentResult && (
                <div className="space-y-4">
                  {/* Tool Call Traces */}
                  <div className="rounded-xl border border-[#1A1A18]/10 bg-white/80 p-4">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#1A1A18]/50">
                      🛠️ Function Calls & Tool Invocations ({agentResult.toolCallsMade?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {agentResult.toolCallsMade?.map((tc, idx) => (
                        <div key={idx} className="rounded-md border border-[#1A1A18]/8 bg-black/5 p-2.5 text-xs font-mono">
                          <div className="flex items-center justify-between text-[#2D6A4F] font-bold">
                            <span>Step {idx + 1}: call {tc.tool}()</span>
                            <span className="text-[10px] text-[#1A1A18]/50">SUCCESS</span>
                          </div>
                          <p className="mt-1 text-[#1A1A18]/70">Args: {JSON.stringify(tc.args)}</p>
                          <p className="mt-0.5 text-[#1A1A18]/55">Result: {JSON.stringify(tc.result)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Plan */}
                  <div className="rounded-xl border border-[#2D6A4F]/25 bg-white/90 p-5 shadow-sm">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#2D6A4F]">
                      📋 Autonomous Contribution Roadmap
                    </h4>
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-[#1A1A18]">
                      {agentResult.finalReport || JSON.stringify(agentResult.contributionPlan, null, 2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#1A1A18]/10 bg-white/80 px-6 py-3 text-xs text-[#1A1A18]/50">
          <span>Protected with Prompt Injection Defenses & Structured Schema validation</span>
          <button
            onClick={onClose}
            className="rounded-md bg-[#1A1A18]/10 px-4 py-1.5 font-semibold text-[#1A1A18] hover:bg-[#1A1A18]/20"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
