import * as fs from 'fs'
import * as path from 'path'
import type { BoardData, CardStatus, Card } from '../../lib/types'
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
}

// Re-exported for modules that resolve project-local paths (activity, cards, …).
export { banDir, tasksDir, columnDir } from './paths'

export function isKanbanProject(projectPath: string): boolean {
  return (
    fs.existsSync(tasksDir(projectPath)) ||
    fs.existsSync(banDir(projectPath)) ||
    fs.existsSync(legacyKanbanDir(projectPath))
  )
}

export function initProject(projectPath: string): void {
  // Move any pre-inversion `.kanban/` layout into the new visible/committed shape
  // before anything reads from disk.
  migrateLegacyKanban(projectPath)

  const bDir = banDir(projectPath)
  if (!fs.existsSync(bDir)) {
    fs.mkdirSync(bDir, { recursive: true })
  }
  ensureBanIgnored(projectPath)

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
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  }

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

/**
 * The Great Inversion: move a pre-inversion `.kanban/` project to the new layout.
 *
 *   .kanban/columns/{status}/*.md  ->  Tasks/{status}/*.md   (visible, committed)
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

/**
 * Ignore only the hidden app-data folder. Crucially, drop any legacy `.kanban/`
 * rule — under the inversion, `Tasks/` is committed truth and must NOT be ignored.
 */
function ensureBanIgnored(projectPath: string): void {
  const gitignorePath = path.join(projectPath, '.gitignore')
  let text = ''
  if (fs.existsSync(gitignorePath)) {
    text = fs.readFileSync(gitignorePath, 'utf-8')
  }

  const kept = text.split(/\r?\n/).filter(line => {
    const t = line.trim()
    return t !== '.kanban/' && t !== '.kanban'
  })

  const hasBan = kept.some(line => {
    const t = line.trim()
    return t === '.ban/' || t === '.ban'
  })

  let next = kept.join('\n')
  if (!hasBan) {
    const prefix = next.length === 0 || next.endsWith('\n') ? '' : '\n'
    next = `${next}${prefix}.ban/\n`
  }

  if (next !== text) {
    fs.writeFileSync(gitignorePath, next, 'utf-8')
  }
}
