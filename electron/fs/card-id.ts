import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'

const STATUSES = ['inbox', 'shape', 'ready', 'doing', 'review', 'done', 'killed']
const NUMERIC_ID = /^\d+$/

export function nextCardId(ids: string[]): string {
  const highest = ids.reduce((max, id) => {
    if (!NUMERIC_ID.test(id)) return max
    return Math.max(max, Number.parseInt(id, 10))
  }, 0)

  return String(highest + 1).padStart(3, '0')
}

export function nextCardIdForProject(projectPath: string): string {
  return nextCardId(readExistingCardIds(projectPath))
}

export function migrateProjectCardIds(projectPath: string): void {
  const cards = readCardIdEntries(projectPath)
  const usedIds = new Set(cards.map(card => card.id).filter(isNumericId))

  for (const card of cards) {
    if (isNumericId(card.id)) continue

    const nextId = nextUnusedCardId(usedIds)
    usedIds.add(nextId)
    rewriteCardId(card.filePath, nextId)

    const nextPath = path.join(path.dirname(card.filePath), `${fileSlug(card.filePath)}__${nextId}.md`)
    if (nextPath !== card.filePath) fs.renameSync(card.filePath, nextPath)
  }
}

function isNumericId(id: string): boolean {
  return NUMERIC_ID.test(id)
}

function nextUnusedCardId(usedIds: Set<string>): string {
  let id = nextCardId(Array.from(usedIds))
  while (usedIds.has(id)) {
    id = String(Number.parseInt(id, 10) + 1).padStart(3, '0')
  }
  return id
}

function readExistingCardIds(projectPath: string): string[] {
  return readCardIdEntries(projectPath).map(card => card.id)
}

function readCardIdEntries(projectPath: string): Array<{ filePath: string; id: string }> {
  const columnsPath = path.join(projectPath, '.kanban', 'columns')
  const cards: Array<{ filePath: string; id: string }> = []

  for (const status of STATUSES) {
    const dir = path.join(columnsPath, status)
    if (!fs.existsSync(dir)) continue

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue
      const filePath = path.join(dir, file)
      cards.push({ filePath, id: readCardId(filePath) })
    }
  }

  return cards
}

function rewriteCardId(filePath: string, id: string): void {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = matter(raw)
  fs.writeFileSync(filePath, matter.stringify(parsed.content, { ...parsed.data, id }), 'utf-8')
}

function readCardId(filePath: string): string {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(raw)
    if (data.id !== undefined && data.id !== null) return String(data.id)
  } catch {
    /* fall back to the filename below */
  }

  const basename = path.basename(filePath, '.md')
  const marker = basename.lastIndexOf('__')
  return marker >= 0 ? basename.slice(marker + 2) : basename
}

function fileSlug(filePath: string): string {
  const basename = path.basename(filePath, '.md')
  const marker = basename.lastIndexOf('__')
  return marker >= 0 ? basename.slice(0, marker) : basename
}
