import * as fs from 'fs'
import * as path from 'path'
import type { AgentInfo, AgentsState } from '../../lib/types'
import { banDir } from './paths'
import { skillsIndexMarkdown } from './skills'

/**
 * The agent registry: every AI agent Ban knows how to project the canonical
 * rules into. `supportsImport` decides projection strategy — a hard file import
 * (deterministic, e.g. Claude Code's `@path`) vs. inlining the rules verbatim.
 */
const REGISTRY: AgentInfo[] = [
  { id: 'claude', name: 'Claude Code', configPath: 'CLAUDE.md', supportsImport: true },
  { id: 'codex', name: 'Codex', configPath: 'AGENTS.md', supportsImport: false },
  { id: 'opencode', name: 'OpenCode', configPath: 'AGENTS.md', supportsImport: false },
]

// Canonical rules file: visible, committed, the single source every agent points to.
const RULES_FILENAME = 'RULES.md'

const BLOCK_START = '<!-- ban:start -->'
const BLOCK_END = '<!-- ban:end -->'
const BLOCK_RE = /<!-- ban:start -->[\s\S]*?<!-- ban:end -->\n?/

export function agentRegistry(): AgentInfo[] {
  return REGISTRY.map(a => ({ ...a }))
}

function rulesPath(projectPath: string): string {
  return path.join(projectPath, RULES_FILENAME)
}

function selectedPath(projectPath: string): string {
  return path.join(banDir(projectPath), 'agents.json')
}

export function readSelectedAgents(projectPath: string): string[] {
  try {
    const raw = fs.readFileSync(selectedPath(projectPath), 'utf-8')
    const data = JSON.parse(raw)
    if (Array.isArray(data.selected)) {
      return data.selected.filter((id: unknown): id is string =>
        typeof id === 'string' && REGISTRY.some(a => a.id === id))
    }
  } catch { /* none selected yet */ }
  return []
}

function writeSelectedAgents(projectPath: string, selected: string[]): void {
  const dir = banDir(projectPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(selectedPath(projectPath), JSON.stringify({ selected }, null, 2), 'utf-8')
}

export function readRules(projectPath: string): string {
  try {
    return fs.readFileSync(rulesPath(projectPath), 'utf-8')
  } catch {
    return ''
  }
}

export function writeRules(projectPath: string, content: string): void {
  fs.writeFileSync(rulesPath(projectPath), content, 'utf-8')
}

function defaultRules(projectName: string): string {
  return `# ${projectName} — Project Rules

> Canonical rules for every AI agent working in this repo. Managed via Ban.
> Each agent's native config (CLAUDE.md, AGENTS.md, …) points back here, so you
> write the rules once and every agent reads the same source of truth.

## Conventions

-

## Tasks & workflow

- Tasks live as markdown files under \`Tasks/{status}/\`. Statuses are folders:
  inbox → shape → ready → doing → review → done (and killed).
- To move a task, move its \`.md\` file into the target status folder.
- When you finish work on a task, move it to \`review\` for human approval.
- Plans live under \`Plans/\`.
`
}

/** Build the managed block written into a single agent config file. */
function buildBlock(agent: AgentInfo, rulesRel: string, rulesText: string, skillsIndex: string): string {
  const header = '<!-- Managed by Ban — do not edit inside this block. Edit ' + rulesRel + ' instead. -->'
  const rules = agent.supportsImport ? `@${rulesRel}` : rulesText.trim()
  // Skills are listed inline for every agent (even import-capable ones) so the
  // index travels with the agent's own config and stays discoverable.
  const body = skillsIndex ? `${rules}\n\n${skillsIndex}` : rules
  return `${BLOCK_START}\n${header}\n\n${body}\n${BLOCK_END}\n`
}

/** Insert or replace Ban's managed block, leaving all other content untouched. */
function applyBlock(existing: string, block: string): string {
  if (BLOCK_RE.test(existing)) {
    return existing.replace(BLOCK_RE, block)
  }
  if (existing.trim() === '') return block
  const sep = existing.endsWith('\n') ? '\n' : '\n\n'
  return `${existing}${sep}${block}`
}

/**
 * Project the canonical rules into every selected agent's native config file.
 * Agents that share a config path (e.g. Codex + OpenCode both use AGENTS.md) are
 * written once; if any sharer supports import, the import strategy wins.
 */
export function projectAgents(projectPath: string, selected: string[]): void {
  const chosen = REGISTRY.filter(a => selected.includes(a.id))
  if (chosen.length === 0) return

  // Ensure a canonical rules file exists to point at.
  if (!fs.existsSync(rulesPath(projectPath))) {
    writeRules(projectPath, defaultRules(path.basename(projectPath)))
  }
  const rulesText = readRules(projectPath)
  const skillsIndex = skillsIndexMarkdown(projectPath)

  // Collapse to unique config files; prefer import if any sharer supports it.
  const byPath = new Map<string, AgentInfo>()
  for (const agent of chosen) {
    const prev = byPath.get(agent.configPath)
    if (!prev || (agent.supportsImport && !prev.supportsImport)) {
      byPath.set(agent.configPath, agent)
    }
  }

  for (const [configPath, agent] of byPath) {
    const abs = path.join(projectPath, configPath)
    let existing = ''
    try { existing = fs.readFileSync(abs, 'utf-8') } catch { /* new file */ }
    const block = buildBlock(agent, RULES_FILENAME, rulesText, skillsIndex)
    fs.writeFileSync(abs, applyBlock(existing, block), 'utf-8')
  }
}

export function setSelectedAgents(projectPath: string, selected: string[]): AgentsState {
  const valid = selected.filter(id => REGISTRY.some(a => a.id === id))
  writeSelectedAgents(projectPath, valid)
  projectAgents(projectPath, valid)
  return getAgentsState(projectPath)
}

/** Re-project current selection — used after the rules file is edited. */
export function reprojectAgents(projectPath: string): AgentsState {
  projectAgents(projectPath, readSelectedAgents(projectPath))
  return getAgentsState(projectPath)
}

export function getAgentsState(projectPath: string): AgentsState {
  return {
    agents: agentRegistry(),
    selected: readSelectedAgents(projectPath),
    rulesPath: RULES_FILENAME,
    rulesContent: readRules(projectPath),
  }
}
