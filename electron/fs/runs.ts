import * as fs from 'fs'
import * as path from 'path'
import type { RunLine, RunMeta } from '../../lib/types'
import { banDir } from './paths'

/**
 * Run persistence. Every agent run is captured as a file pair under `.ban/runs/`:
 *   run_<id>.meta.json  — the run's metadata (agent, card, status, session id)
 *   run_<id>.jsonl      — the full streamed transcript, one RunLine per line
 *
 * This is the heart of the anti-lock-in promise: the conversation is yours, on
 * disk, retrievable forever — even if the agent or its own history disappears.
 */

export function runsDir(projectPath: string): string {
  return path.join(banDir(projectPath), 'runs')
}

function metaPath(projectPath: string, runId: string): string {
  return path.join(runsDir(projectPath), `run_${runId}.meta.json`)
}

function logPath(projectPath: string, runId: string): string {
  return path.join(runsDir(projectPath), `run_${runId}.jsonl`)
}

function ensureDir(projectPath: string): void {
  const dir = runsDir(projectPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function writeRunMeta(projectPath: string, meta: RunMeta): void {
  ensureDir(projectPath)
  fs.writeFileSync(metaPath(projectPath, meta.id), JSON.stringify(meta, null, 2), 'utf-8')
}

export function appendRunLine(projectPath: string, runId: string, line: RunLine): void {
  ensureDir(projectPath)
  fs.appendFileSync(logPath(projectPath, runId), JSON.stringify(line) + '\n', 'utf-8')
}

export function listRunMetas(projectPath: string): RunMeta[] {
  const dir = runsDir(projectPath)
  if (!fs.existsSync(dir)) return []
  const metas: RunMeta[] = []
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.meta.json')) continue
    try {
      metas.push(JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8')))
    } catch { /* skip corrupt */ }
  }
  return metas.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
}

export function readRunLines(projectPath: string, runId: string): RunLine[] {
  const file = logPath(projectPath, runId)
  if (!fs.existsSync(file)) return []
  return fs.readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(l => { try { return JSON.parse(l) as RunLine } catch { return null } })
    .filter((l): l is RunLine => l !== null)
}
