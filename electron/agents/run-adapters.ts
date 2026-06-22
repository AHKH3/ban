/**
 * Run adapters — how Ban drives each local agent CLI as a headless run.
 *
 * Every adapter is deliberately uniform so adding the next agent (Claude,
 * Antigravity, OpenCode) is a matter of describing its flags, not rewriting the
 * runner. The runner stays agent-agnostic; only this table knows the specifics.
 *
 * Security model (user choice): "auto, confined to the project". Each adapter
 * encodes that natively — sandbox/approval flags scoped to the working dir, the
 * process `cwd` locked to the repo, and never an interactive approval prompt.
 */

export interface ParsedLine {
  text: string        // human-readable line for the live panel
  sessionId?: string  // the agent's own session id, if this event reveals one
}

export interface RunAdapter {
  id: string
  name: string
  bin: string                 // command Ban spawns (resolved via shell/PATH)
  versionArgs: string[]       // args to probe availability + version
  /** Static args for a headless, auto-confined run. The prompt is NOT here. */
  runArgs(): string[]
  /** How the briefing reaches the agent: a trailing CLI arg, or piped on stdin. */
  promptVia: 'arg' | 'stdin'
  /** Parse one raw output line into display text (+ optional session id). */
  parseLine(raw: string): ParsedLine
}

/** Pull the most useful human-readable text out of a Codex JSONL event. */
function parseCodexLine(raw: string): ParsedLine {
  const trimmed = raw.trim()
  if (!trimmed) return { text: '' }
  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(trimmed)
  } catch {
    // Not JSON (a stray log line) — show it verbatim rather than dropping it.
    return { text: trimmed }
  }

  const sessionId =
    (obj.session_id as string) || (obj.thread_id as string) ||
    (obj.conversation_id as string) || undefined

  // Codex exec --json emits typed events; reach into the common shapes for text.
  const item = (obj.item ?? obj.msg ?? obj) as Record<string, unknown>
  const text =
    (item.text as string) ??
    (item.message as string) ??
    (item.content as string) ??
    (obj.delta as string) ??
    ''

  const type = (obj.type as string) ?? (item.type as string) ?? ''
  // For events with no obvious text, surface a compact type marker so the user
  // still sees activity (tool calls, reasoning, etc.) instead of silence.
  const display = text || (type ? `· ${type}` : trimmed)
  return { text: display, sessionId }
}

const CODEX: RunAdapter = {
  id: 'codex',
  name: 'Codex',
  bin: 'codex',
  versionArgs: ['--version'],
  promptVia: 'stdin',
  runArgs: () => [
    'exec',
    '--json',
    '--sandbox', 'workspace-write',     // may write only within the workspace (repo)
    '--ask-for-approval', 'never',       // headless: never block on a prompt
    '--skip-git-repo-check',
    '-',                                 // read the briefing from stdin
  ],
  parseLine: parseCodexLine,
}

// Order = display order in the agent picker. Codex first (the proving ground).
// Claude, Antigravity, OpenCode adapters land in O2 with the same shape.
const ADAPTERS: RunAdapter[] = [CODEX]

export function runAdapters(): RunAdapter[] {
  return ADAPTERS
}

export function getRunAdapter(id: string): RunAdapter | undefined {
  return ADAPTERS.find(a => a.id === id)
}
