import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'
import type { PlanDoc } from '../../lib/types'
import { plansDir } from './paths'
import { makeSlug } from './cards'
import { nextCardId } from './card-id'

function ensureDir(projectPath: string): string {
  const dir = plansDir(projectPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function extractTitle(body: string): string {
  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : ''
}

function readPlanFile(filePath: string): PlanDoc {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const title = extractTitle(content) || data.title || path.basename(filePath, '.md')
  return {
    id: data.id ? String(data.id) : path.basename(filePath, '.md'),
    title,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
    body: content.trim(),
    filePath,
    fileName: path.basename(filePath),
  }
}

export function readPlans(projectPath: string): PlanDoc[] {
  const dir = ensureDir(projectPath)
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      try { return readPlanFile(path.join(dir, f)) } catch { return null }
    })
    .filter((p): p is PlanDoc => p !== null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function existingIds(projectPath: string): string[] {
  return readPlans(projectPath).map(p => p.id)
}

function writePlanFile(dir: string, plan: Omit<PlanDoc, 'filePath' | 'fileName'>): PlanDoc {
  const fileName = `${makeSlug(plan.title)}__${plan.id}.md`
  const filePath = path.join(dir, fileName)
  const frontmatter = { id: plan.id, createdAt: plan.createdAt, updatedAt: plan.updatedAt }
  fs.writeFileSync(filePath, matter.stringify(plan.body, frontmatter), 'utf-8')
  return { ...plan, filePath, fileName }
}

export function createPlan(projectPath: string, title: string): PlanDoc {
  const dir = ensureDir(projectPath)
  const now = new Date().toISOString()
  const cleanTitle = title.trim() || 'Untitled plan'
  return writePlanFile(dir, {
    id: nextCardId(existingIds(projectPath)),
    title: cleanTitle,
    createdAt: now,
    updatedAt: now,
    body: `# ${cleanTitle}\n\n`,
  })
}

export function updatePlan(
  projectPath: string,
  id: string,
  updates: { title?: string; body?: string }
): PlanDoc | null {
  const dir = ensureDir(projectPath)
  const existing = readPlans(projectPath).find(p => p.id === id)
  if (!existing) return null

  const now = new Date().toISOString()
  const body = updates.body ?? existing.body
  const title = updates.title?.trim() || extractTitle(body) || existing.title

  // Title drives the filename; delete the old file if the slug changed.
  if (fs.existsSync(existing.filePath)) fs.unlinkSync(existing.filePath)
  return writePlanFile(dir, {
    id: existing.id,
    title,
    createdAt: existing.createdAt,
    updatedAt: now,
    body,
  })
}

export function deletePlan(projectPath: string, id: string): void {
  const existing = readPlans(projectPath).find(p => p.id === id)
  if (existing && fs.existsSync(existing.filePath)) fs.unlinkSync(existing.filePath)
}
