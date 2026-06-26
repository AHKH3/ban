import * as fs from 'fs'
import * as path from 'path'
import type { BoardData, CardStatus, Card, ProjectVersioningSettings } from '../../lib/types'
import { migrateProjectCardIds } from './card-id'
import { readCardFile } from './cards'
import {
  STATUSES,
  banDir,
  tasksDir,
  columnDir,
  legacyKanbanDir,
} from './paths'

export interface KanbanConfig {
  name: string
  createdAt: string
  versioning?: ProjectVersioningSettings
}

// Re-exported for modules that resolve project-local paths (activity, cards, …).
export { banDir, tasksDir, columnDir } from './paths'

export const DEFAULT_VERSIONING_SETTINGS: ProjectVersioningSettings = {
  trackTasks: false,
  trackPlans: false,
  trackSkills: false,
  trackAgentRules: false,
}

const ALWAYS_PRIVATE_IGNORE_RULES = ['.ban/', '.kanban/']
const TASK_IGNORE_RULES = ['Tasks/']
const PLAN_IGNORE_RULES = ['Plans/']
const SKILL_IGNORE_RULES = ['Skills/']
const AGENT_RULE_IGNORE_RULES = ['RULES.md', 'AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'OPENCODE.md']

const ALL_BAN_MANAGED_IGNORE_RULES = new Set([
  ...ALWAYS_PRIVATE_IGNORE_RULES,
  ...TASK_IGNORE_RULES,
  ...PLAN_IGNORE_RULES,
  ...SKILL_IGNORE_RULES,
  ...AGENT_RULE_IGNORE_RULES,
])
const BAN_MANAGED_DIR_IGNORE_RULES = new Set([
  '.ban',
  '.kanban',
  'Tasks',
  'Plans',
  'Skills',
])

export function isKanbanProject(projectPath: string): boolean {
  return (
    fs.existsSync(tasksDir(projectPath)) ||
    fs.existsSync(banDir(projectPath)) ||
    fs.existsSync(legacyKanbanDir(projectPath))
  )
}

export function initProject(projectPath: string): void {
  // Move any pre-inversion `.kanban/` layout into the new visible/local shape
  // before anything reads from disk.
  migrateLegacyKanban(projectPath)

  const bDir = banDir(projectPath)
  if (!fs.existsSync(bDir)) {
    fs.mkdirSync(bDir, { recursive: true })
  }

  for (const status of STATUSES) {
    const dir = columnDir(projectPath, status)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  const configPath = path.join(bDir, 'config.json')
  if (!fs.existsSync(configPath)) {
    const config: KanbanConfig = {
      name: path.basename(projectPath),
      createdAt: new Date().toISOString(),
      versioning: DEFAULT_VERSIONING_SETTINGS,
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  }
  ensureBanIgnored(projectPath)

  const tagsPath = path.join(bDir, 'tags.json')
  if (!fs.existsSync(tagsPath)) {
    fs.writeFileSync(tagsPath, JSON.stringify({ tags: [] }, null, 2), 'utf-8')
  }

  migrateProjectCardIds(projectPath)
}

export function readBoard(projectPath: string): BoardData {
  initProject(projectPath)

  const configPath = path.join(banDir(projectPath), 'config.json')
  let projectName = path.basename(projectPath)
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as KanbanConfig
    projectName = config.name
  } catch { /* ignore */ }

  const tagsPath = path.join(banDir(projectPath), 'tags.json')
  let allTags: string[] = []
  try {
    const tagsData = JSON.parse(fs.readFileSync(tagsPath, 'utf-8'))
    allTags = tagsData.tags ?? []
  } catch { /* ignore */ }

  const columns: Record<CardStatus, Card[]> = {
    inbox: [], shape: [], ready: [], doing: [], review: [], done: [], killed: [],
  }

  for (const status of STATUSES) {
    const dir = columnDir(projectPath, status)
    if (!fs.existsSync(dir)) continue
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
    for (const file of files) {
      try {
        const card = readCardFile(path.join(dir, file))
        // Ensure status matches the folder it lives in
        card.status = status
        columns[status].push(card)
        // Merge tags into allTags
        for (const tag of card.tags) {
          if (!allTags.includes(tag)) allTags.push(tag)
        }
      } catch { /* skip corrupt files */ }
    }
  }

  // Sort each column by updatedAt desc
  for (const status of STATUSES) {
    columns[status].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  return { projectPath, projectName, columns, tags: allTags }
}

export function saveTags(projectPath: string, tags: string[]): void {
  const tagsPath = path.join(banDir(projectPath), 'tags.json')
  fs.writeFileSync(tagsPath, JSON.stringify({ tags }, null, 2), 'utf-8')
}

export function getProjectVersioningSettings(projectPath: string): ProjectVersioningSettings {
  initProject(projectPath)
  return readProjectConfig(projectPath).versioning ?? DEFAULT_VERSIONING_SETTINGS
}

export function updateProjectVersioningSettings(
  projectPath: string,
  settings: unknown
): ProjectVersioningSettings {
  initProject(projectPath)
  const config = readProjectConfig(projectPath)
  const versioning = normalizeVersioningSettings(settings)
  writeProjectConfig(projectPath, { ...config, versioning })
  ensureBanIgnored(projectPath, versioning)
  return versioning
}

/**
 * The Great Inversion: move a pre-inversion `.kanban/` project to the new layout.
 *
 *   .kanban/columns/{status}/*.md  ->  Tasks/{status}/*.md   (visible, local)
 *   .kanban/{config,tags}.json     ->  .ban/{config,tags}.json (hidden, app data)
 *   .kanban/activity/              ->  .ban/activity/
 *
 * Idempotent and non-destructive: never overwrites a file that already exists at
 * the destination, so a half-migrated project converges cleanly.
 */
function migrateLegacyKanban(projectPath: string): void {
  const legacy = legacyKanbanDir(projectPath)
  if (!fs.existsSync(legacy)) return

  // 1. Cards -> Tasks/{status}/
  const legacyColumns = path.join(legacy, 'columns')
  if (fs.existsSync(legacyColumns)) {
    for (const status of STATUSES) {
      const from = path.join(legacyColumns, status)
      if (!fs.existsSync(from)) continue
      const to = columnDir(projectPath, status)
      fs.mkdirSync(to, { recursive: true })
      for (const file of fs.readdirSync(from)) {
        if (!file.endsWith('.md')) continue
        const dest = path.join(to, file)
        if (!fs.existsSync(dest)) fs.renameSync(path.join(from, file), dest)
      }
    }
  }

  // 2. App metadata -> .ban/
  const bDir = banDir(projectPath)
  fs.mkdirSync(bDir, { recursive: true })
  for (const meta of ['config.json', 'tags.json']) {
    const from = path.join(legacy, meta)
    const to = path.join(bDir, meta)
    if (fs.existsSync(from) && !fs.existsSync(to)) fs.renameSync(from, to)
  }
  const fromActivity = path.join(legacy, 'activity')
  const toActivity = path.join(bDir, 'activity')
  if (fs.existsSync(fromActivity) && !fs.existsSync(toActivity)) {
    fs.renameSync(fromActivity, toActivity)
  }

  // 3. Drop the empty legacy shell (best-effort).
  try { fs.rmSync(legacy, { recursive: true, force: true }) } catch { /* ignore */ }
}

function readProjectConfig(projectPath: string): KanbanConfig {
  const configPath = path.join(banDir(projectPath), 'config.json')
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Partial<KanbanConfig>
    return {
      name: parsed.name || path.basename(projectPath),
      createdAt: parsed.createdAt || new Date().toISOString(),
      versioning: normalizeVersioningSettings(parsed.versioning),
    }
  } catch {
    return {
      name: path.basename(projectPath),
      createdAt: new Date().toISOString(),
      versioning: DEFAULT_VERSIONING_SETTINGS,
    }
  }
}

function writeProjectConfig(projectPath: string, config: KanbanConfig): void {
  const bDir = banDir(projectPath)
  if (!fs.existsSync(bDir)) fs.mkdirSync(bDir, { recursive: true })
  fs.writeFileSync(path.join(bDir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8')
}

function normalizeVersioningSettings(value: unknown): ProjectVersioningSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_VERSIONING_SETTINGS }
  const partial = value as Partial<ProjectVersioningSettings>
  return {
    trackTasks: partial.trackTasks ?? DEFAULT_VERSIONING_SETTINGS.trackTasks,
    trackPlans: partial.trackPlans ?? DEFAULT_VERSIONING_SETTINGS.trackPlans,
    trackSkills: partial.trackSkills ?? DEFAULT_VERSIONING_SETTINGS.trackSkills,
    trackAgentRules: partial.trackAgentRules ?? DEFAULT_VERSIONING_SETTINGS.trackAgentRules,
  }
}

function ignoreRulesFor(settings: ProjectVersioningSettings): string[] {
  return [
    ...ALWAYS_PRIVATE_IGNORE_RULES,
    ...(settings.trackTasks ? [] : TASK_IGNORE_RULES),
    ...(settings.trackPlans ? [] : PLAN_IGNORE_RULES),
    ...(settings.trackSkills ? [] : SKILL_IGNORE_RULES),
    ...(settings.trackAgentRules ? [] : AGENT_RULE_IGNORE_RULES),
  ]
}

function normalizeBanManagedIgnoreRule(rule: string): string {
  if (BAN_MANAGED_DIR_IGNORE_RULES.has(rule.replace(/\/$/, ''))) {
    return `${rule.replace(/\/$/, '')}/`
  }
  return rule
}

function ensureBanIgnored(
  projectPath: string,
  settings = readProjectConfig(projectPath).versioning ?? DEFAULT_VERSIONING_SETTINGS
): void {
  const gitignorePath = path.join(projectPath, '.gitignore')
  let text = ''
  if (fs.existsSync(gitignorePath)) {
    text = fs.readFileSync(gitignorePath, 'utf-8')
  }

  const kept = text.split(/\r?\n/).filter(line => {
    const t = line.trim()
    return !ALL_BAN_MANAGED_IGNORE_RULES.has(normalizeBanManagedIgnoreRule(t))
  })

  const wanted = ignoreRulesFor(settings)
  const existing = new Set(kept.map(line => line.trim()))
  const missing = wanted.filter(rule => !existing.has(rule))

  let next = kept.join('\n')
  if (missing.length > 0) {
    const prefix = next.length === 0 || next.endsWith('\n') ? '' : '\n'
    next = `${next}${prefix}${missing.join('\n')}\n`
  }

  if (next !== text) {
    fs.writeFileSync(gitignorePath, next, 'utf-8')
  }
}
