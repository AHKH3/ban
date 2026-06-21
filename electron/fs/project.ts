import * as fs from 'fs'
import * as path from 'path'
import type { BoardData, CardStatus, Card } from '../../lib/types'
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
}

export function readBoard(projectPath: string): BoardData {
  if (!isKanbanProject(projectPath)) {
    initProject(projectPath)
  }

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
