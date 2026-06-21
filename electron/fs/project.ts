import * as fs from 'fs'
import * as path from 'path'
import type { BoardData, CardStatus, Card } from '../../lib/types'
import { migrateProjectCardIds } from './card-id'
import { readCardFile } from './cards'

const STATUSES: CardStatus[] = ['inbox', 'shape', 'ready', 'doing', 'review', 'done', 'killed']

export interface KanbanConfig {
  name: string
  createdAt: string
}

export function kanbanDir(projectPath: string): string {
  return path.join(projectPath, '.kanban')
}

export function columnDir(projectPath: string, status: CardStatus): string {
  return path.join(kanbanDir(projectPath), 'columns', status)
}

export function isKanbanProject(projectPath: string): boolean {
  return fs.existsSync(kanbanDir(projectPath))
}

export function initProject(projectPath: string): void {
  const kDir = kanbanDir(projectPath)
  if (!fs.existsSync(kDir)) {
    fs.mkdirSync(kDir, { recursive: true })
  }
  ensureKanbanIgnored(projectPath)

  const columnsDir = path.join(kDir, 'columns')
  for (const status of STATUSES) {
    const dir = path.join(columnsDir, status)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  const configPath = path.join(kDir, 'config.json')
  if (!fs.existsSync(configPath)) {
    const config: KanbanConfig = {
      name: path.basename(projectPath),
      createdAt: new Date().toISOString(),
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  }

  const tagsPath = path.join(kDir, 'tags.json')
  if (!fs.existsSync(tagsPath)) {
    fs.writeFileSync(tagsPath, JSON.stringify({ tags: [] }, null, 2), 'utf-8')
  }

  migrateProjectCardIds(projectPath)
}

export function readBoard(projectPath: string): BoardData {
  initProject(projectPath)

  const configPath = path.join(kanbanDir(projectPath), 'config.json')
  let projectName = path.basename(projectPath)
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as KanbanConfig
    projectName = config.name
  } catch { /* ignore */ }

  const tagsPath = path.join(kanbanDir(projectPath), 'tags.json')
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
  const tagsPath = path.join(kanbanDir(projectPath), 'tags.json')
  fs.writeFileSync(tagsPath, JSON.stringify({ tags }, null, 2), 'utf-8')
}

function ensureKanbanIgnored(projectPath: string): void {
  const gitignorePath = path.join(projectPath, '.gitignore')
  const rule = '.kanban/'

  let gitignore = ''
  if (fs.existsSync(gitignorePath)) {
    gitignore = fs.readFileSync(gitignorePath, 'utf-8')
  }

  const hasRule = gitignore
    .split(/\r?\n/)
    .map(line => line.trim())
    .some(line => line === rule || line === '.kanban')

  if (hasRule) return

  const prefix = gitignore.length === 0 || gitignore.endsWith('\n') ? '' : '\n'
  fs.writeFileSync(gitignorePath, `${gitignore}${prefix}${rule}\n`, 'utf-8')
}
