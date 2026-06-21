import * as fs from 'fs'
import * as path from 'path'
import { nanoid } from 'nanoid'
import type { ActivityEvent, ActivityRange, ActivityCardSnapshot, Card } from '../../lib/types'
import { kanbanDir } from './project'

export function activityDir(projectPath: string): string {
  return path.join(kanbanDir(projectPath), 'activity')
}

export function activityFilePath(projectPath: string, date = new Date()): string {
  const month = date.toISOString().slice(0, 7)
  return path.join(activityDir(projectPath), `${month}.jsonl`)
}

export function cardSnapshot(card: Card): ActivityCardSnapshot {
  return {
    id: card.id,
    title: card.title,
    status: card.status,
    type: card.type,
    priority: card.priority,
    tags: [...card.tags],
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    fileName: card.fileName,
  }
}

export function appendActivityEvent(
  projectPath: string,
  event: Omit<ActivityEvent, 'id' | 'schemaVersion' | 'actor' | 'source' | 'createdAt'>
): ActivityEvent {
  const createdAt = new Date().toISOString()
  const fullEvent: ActivityEvent = {
    id: `evt_${nanoid(10)}`,
    schemaVersion: 1,
    actor: 'ban',
    source: 'app',
    createdAt,
    ...event,
  }

  const dir = activityDir(projectPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.appendFileSync(activityFilePath(projectPath, new Date(createdAt)), `${JSON.stringify(fullEvent)}\n`, 'utf-8')

  return fullEvent
}

export function readActivityEvents(projectPath: string, range: ActivityRange = {}): ActivityEvent[] {
  const dir = activityDir(projectPath)
  if (!fs.existsSync(dir)) return []

  const startMs = range.start ? new Date(range.start).getTime() : Number.NEGATIVE_INFINITY
  const endMs = range.end ? new Date(range.end).getTime() : Number.POSITIVE_INFINITY

  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.jsonl'))
    .sort()
    .flatMap(file => readActivityFile(path.join(dir, file)))
    .filter(event => {
      const time = new Date(event.createdAt).getTime()
      return Number.isFinite(time) && time >= startMs && time <= endMs
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

function readActivityFile(filePath: string): ActivityEvent[] {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return raw.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .flatMap(line => {
      try {
        const parsed = JSON.parse(line) as ActivityEvent
        return parsed.schemaVersion === 1 && typeof parsed.kind === 'string' ? [parsed] : []
      } catch {
        return []
      }
    })
}
