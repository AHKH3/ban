import { spawn, spawnSync, type ChildProcess } from 'child_process'
import { nanoid } from 'nanoid'
import type { BrowserWindow } from 'electron'
import type {
  AvailableAgent, CardStatus, RunMeta, RunLine, RunMessage, RunStartInput,
} from '../../lib/types'
import { readBoard } from '../fs/project'
import { readRules } from '../fs/agents'
import { skillsIndexMarkdown } from '../fs/skills'
import { moveCardFile } from '../fs/cards'
import { appendActivityEvent, cardSnapshot } from '../fs/activity'
import { indexCard } from '../db'
import { suppressPath } from '../watcher'
import { writeRunMeta, appendRunLine } from '../fs/runs'
import { getRunAdapter, runAdapters } from './run-adapters'
import type { Card } from '../../lib/types'

interface ActiveRun {
  child: ChildProcess
  projectPath: string
  meta: RunMeta
  cancelled?: boolean
}

const active = new Map<string, ActiveRun>()

// --- Detection ------------------------------------------------------------

/** Probe each known adapter's CLI to see what's installed on this machine. */
export function detectAgents(): AvailableAgent[] {
  return runAdapters().map(a => {
    try {
      const res = spawnSync(a.bin, a.versionArgs, {
        shell: true, encoding: 'utf-8', timeout: 8000, windowsHide: true,
      })
      const out = `${res.stdout ?? ''}${res.stderr ?? ''}`.trim()
      const available = res.status === 0 || /\d+\.\d+/.test(out)
      const version = available ? (out.split('\n')[0] || undefined) : undefined
      return { id: a.id, name: a.name, available, version }
    } catch {
      return { id: a.id, name: a.name, available: false }
    }
  })
}

// --- Briefing -------------------------------------------------------------

function buildBriefing(projectPath: string, card: Card): string {
  const rules = readRules(projectPath).trim()
  const skills = skillsIndexMarkdown(projectPath).trim()
  const parts = [
    `You are an AI coding agent working directly in the repository at:\n${projectPath}`,
    `# Task ${card.id}: ${card.title}\n\n${card.body.trim()}`,
  ]
  if (rules) parts.push(`# Project rules (the single source of truth)\n\n${rules}`)
  if (skills) parts.push(skills)
  parts.push(
    `# Protocol\n` +
    `- Work directly on the files in this repository to complete the task above.\n` +
    `- Do NOT move or rename the task's own card file under Tasks/. When you are\n` +
    `  done, simply stop — Ban will move this task to "review" for human approval.\n` +
    `- Keep changes scoped to this task.`,
  )
  return parts.join('\n\n---\n\n') + '\n'
}

// --- Helpers --------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString()
}

function findCard(projectPath: string, cardId: string): Card | undefined {
  const board = readBoard(projectPath)
  return Object.values(board.columns).flat().find(c => c.id === cardId)
}

function send(win: BrowserWindow | null, msg: RunMessage): void {
  if (win && !win.isDestroyed()) win.webContents.send('run:event', msg)
}

function emitLine(
  win: BrowserWindow | null, projectPath: string, runId: string,
  stream: RunLine['stream'], text: string, raw?: string,
): void {
  const line: RunLine = { t: nowIso(), stream, text, raw }
  appendRunLine(projectPath, runId, line)
  send(win, { runId, kind: 'line', line })
}

/** Move a card to a new status as an action attributed to the agent. */
function moveCardAs(projectPath: string, card: Card, to: CardStatus, agentId: string): Card {
  const before = cardSnapshot(card)
  const moved = moveCardFile(card, to, projectPath, suppressPath)
  appendActivityEvent(projectPath, {
    kind: 'card.moved',
    actor: agentId,
    source: 'external',
    cardId: moved.id,
    cardTitle: moved.title,
    before,
    after: cardSnapshot(moved),
    changedFields: ['status'],
  })
  indexCard(moved, projectPath)
  return moved
}

function notifyBoard(win: BrowserWindow | null, projectPath: string): void {
  if (win && !win.isDestroyed()) win.webContents.send('board:changed', { projectPath })
}

/** Best-effort kill of a process (tree, on Windows) for a cancelled run. */
function killTree(child: ChildProcess): void {
  if (child.pid == null) { child.kill(); return }
  if (process.platform === 'win32') {
    try {
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true })
      return
    } catch { /* fall through */ }
  }
  try { child.kill('SIGTERM') } catch { /* ignore */ }
}

// --- Run lifecycle --------------------------------------------------------

export function startRun(input: RunStartInput, win: BrowserWindow | null): RunMeta {
  const { projectPath, cardId, agentId } = input
  const adapter = getRunAdapter(agentId)
  if (!adapter) throw new Error(`Unknown agent: ${agentId}`)

  const card0 = findCard(projectPath, cardId)
  if (!card0) throw new Error(`Card ${cardId} not found`)

  const runId = nanoid(10)
  const meta: RunMeta = {
    id: runId,
    agentId: adapter.id,
    agentName: adapter.name,
    cardId: card0.id,
    cardTitle: card0.title,
    status: 'running',
    startedAt: nowIso(),
  }
  writeRunMeta(projectPath, meta)

  // Signal start: move the card into "doing" so the board reflects who's working.
  let card = card0
  try {
    if (card.status !== 'doing' && card.status !== 'review' && card.status !== 'done') {
      card = moveCardAs(projectPath, card, 'doing', adapter.id)
      notifyBoard(win, projectPath)
    }
  } catch { /* non-fatal — proceed with the run */ }

  emitLine(win, projectPath, runId, 'system', `▷ ${adapter.name} started on task ${card.id}: ${card.title}`)

  const briefing = buildBriefing(projectPath, card)
  const child = spawn(adapter.bin, adapter.runArgs(), {
    cwd: projectPath,
    shell: true,
    windowsHide: true,
    env: process.env,
  })
  active.set(runId, { child, projectPath, meta })

  if (adapter.promptVia === 'stdin' && child.stdin) {
    child.stdin.write(briefing)
    child.stdin.end()
  }

  const handleChunk = (buf: Buffer | string, stream: 'stdout' | 'stderr') => {
    const text = buf.toString()
    for (const raw of text.split(/\r?\n/)) {
      if (!raw.trim()) continue
      if (stream === 'stdout') {
        const parsed = adapter.parseLine(raw)
        if (parsed.sessionId && !meta.sessionId) {
          meta.sessionId = parsed.sessionId
          writeRunMeta(projectPath, meta)
        }
        if (parsed.text) emitLine(win, projectPath, runId, 'stdout', parsed.text, raw)
      } else {
        emitLine(win, projectPath, runId, 'stderr', raw)
      }
    }
  }

  child.stdout?.on('data', d => handleChunk(d, 'stdout'))
  child.stderr?.on('data', d => handleChunk(d, 'stderr'))

  child.on('error', err => finish(runId, win, 'failed', null, String(err)))
  child.on('close', code => finish(runId, win, code === 0 ? 'completed' : 'failed', code))

  return meta
}

function finish(
  runId: string, win: BrowserWindow | null,
  status: RunMeta['status'], code: number | null, error?: string,
): void {
  const run = active.get(runId)
  if (!run) return
  active.delete(runId)
  const { projectPath, meta } = run

  // A user-initiated stop wins over whatever exit code the kill produced.
  if (run.cancelled) status = 'cancelled'
  meta.status = status
  meta.endedAt = nowIso()
  if (code != null) meta.exitCode = code
  if (error) meta.error = error

  // On success, hand the task to "review" for the human — the status protocol.
  if (status === 'completed') {
    try {
      const fresh = findCard(projectPath, meta.cardId)
      if (fresh && fresh.status !== 'review' && fresh.status !== 'done') {
        const moved = moveCardAs(projectPath, fresh, 'review', meta.agentId)
        meta.movedTo = moved.status
      }
    } catch { /* leave the card where it is */ }
  }

  writeRunMeta(projectPath, meta)
  const label =
    status === 'completed' ? `✓ ${meta.agentName} finished — task moved to review`
    : status === 'cancelled' ? `■ ${meta.agentName} run cancelled`
    : `✗ ${meta.agentName} run failed${code != null ? ` (exit ${code})` : ''}${error ? `: ${error}` : ''}`
  emitLine(win, projectPath, runId, 'system', label)
  send(win, { runId, kind: 'status', meta })
  notifyBoard(win, projectPath)
}

export function stopRun(runId: string): void {
  const run = active.get(runId)
  if (!run) return
  run.cancelled = true   // finish() (via the child's 'close' event) honors this
  killTree(run.child)
}

export function isRunActive(runId: string): boolean {
  return active.has(runId)
}

// Re-export so the IPC layer reads history without importing fs/runs directly.
export { listRunMetas, readRunLines } from '../fs/runs'
