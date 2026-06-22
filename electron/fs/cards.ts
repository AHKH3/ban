import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'
import slugify from 'slugify'
import type { Card, CardStatus, NewCardInput } from '../../lib/types'
import { nextCardIdForProject } from './card-id'
import { columnDir } from './paths'

export function makeSlug(title: string): string {
  return slugify(title, { lower: true, strict: true, trim: true }).slice(0, 50) || 'card'
}

export function makeFileName(title: string, id: string): string {
  return `${makeSlug(title)}__${id}.md`
}

export function readCardFile(filePath: string): Card {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  const title = extractTitle(content) || data.title || path.basename(filePath, '.md')
  return {
    id: data.id ?? path.basename(filePath, '.md'),
    title,
    status: data.status ?? 'inbox',
    type: data.type ?? 'task',
    priority: data.priority ?? 'normal',
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
    body: content.trim(),
    filePath,
    fileName: path.basename(filePath),
  }
}

function extractTitle(body: string): string {
  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : ''
}

export function writeCard(
  projectPath: string,
  card: Omit<Card, 'filePath' | 'fileName'>,
  suppressFn?: (filePath: string) => void
): Card {
  const dir = columnDir(projectPath, card.status)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const fileName = makeFileName(card.title, card.id)
  const filePath = path.join(dir, fileName)

  const frontmatter = {
    id: card.id,
    status: card.status,
    type: card.type,
    priority: card.priority,
    tags: card.tags,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  }

  const body = card.body || defaultCardBody(card.title)
  const fileContent = matter.stringify(body, frontmatter)

  if (suppressFn) suppressFn(filePath)
  fs.writeFileSync(filePath, fileContent, 'utf-8')

  return { ...card, filePath, fileName }
}

export function updateCardFile(
  existingCard: Card,
  updates: Partial<Omit<Card, 'filePath' | 'fileName' | 'createdAt'>>,
  projectPath: string,
  suppressFn?: (filePath: string) => void
): Card {
  const now = new Date().toISOString()
  const updated: Card = {
    ...existingCard,
    ...updates,
    updatedAt: now,
    filePath: existingCard.filePath,
    fileName: existingCard.fileName,
  }

  // Suppress old path before writing
  if (suppressFn) suppressFn(existingCard.filePath)
  // Delete old file
  if (fs.existsSync(existingCard.filePath)) fs.unlinkSync(existingCard.filePath)

  // If title changed, file name changes
  const newFileName = makeFileName(updated.title, updated.id)
  const dir = columnDir(projectPath, updated.status)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const newFilePath = path.join(dir, newFileName)

  const frontmatter = {
    id: updated.id,
    status: updated.status,
    type: updated.type,
    priority: updated.priority,
    tags: updated.tags,
    createdAt: updated.createdAt,
    updatedAt: now,
  }

  const body = updated.body || defaultCardBody(updated.title)
  const fileContent = matter.stringify(body, frontmatter)

  if (suppressFn) suppressFn(newFilePath)
  fs.writeFileSync(newFilePath, fileContent, 'utf-8')

  return { ...updated, filePath: newFilePath, fileName: newFileName }
}

export function moveCardFile(
  card: Card,
  newStatus: CardStatus,
  projectPath: string,
  suppressFn?: (filePath: string) => void
): Card {
  if (card.status === newStatus) return card

  const newDir = columnDir(projectPath, newStatus)
  if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true })

  const newFilePath = path.join(newDir, card.fileName)
  const now = new Date().toISOString()

  // Re-write with updated status/updatedAt
  const frontmatter = {
    id: card.id,
    status: newStatus,
    type: card.type,
    priority: card.priority,
    tags: card.tags,
    createdAt: card.createdAt,
    updatedAt: now,
  }
  const fileContent = matter.stringify(card.body || '', frontmatter)

  if (suppressFn) {
    suppressFn(card.filePath)
    suppressFn(newFilePath)
  }

  fs.writeFileSync(newFilePath, fileContent, 'utf-8')
  if (fs.existsSync(card.filePath) && card.filePath !== newFilePath) {
    fs.unlinkSync(card.filePath)
  }

  return { ...card, status: newStatus, filePath: newFilePath, updatedAt: now }
}

export function deleteCardFile(
  card: Card,
  suppressFn?: (filePath: string) => void
): void {
  if (suppressFn) suppressFn(card.filePath)
  if (fs.existsSync(card.filePath)) fs.unlinkSync(card.filePath)
}

export function createCard(
  projectPath: string,
  input: NewCardInput,
  suppressFn?: (filePath: string) => void
): Card {
  const id = nextCardIdForProject(projectPath)
  const now = new Date().toISOString()
  const card: Omit<Card, 'filePath' | 'fileName'> = {
    id,
    title: input.title || 'Untitled',
    status: input.status ?? 'inbox',
    type: input.type ?? 'task',
    priority: input.priority ?? 'normal',
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
    body: input.body || defaultCardBody(input.title || 'Untitled'),
  }
  return writeCard(projectPath, card, suppressFn)
}

function defaultCardBody(title: string): string {
  return `# ${title}

## Why it matters



## Related



## Outcome

`
}
