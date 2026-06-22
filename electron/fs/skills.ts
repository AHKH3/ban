import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'
import type { SkillDoc } from '../../lib/types'
import { skillsDir } from './paths'
import { makeSlug } from './cards'

function ensureDir(projectPath: string): string {
  const dir = skillsDir(projectPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function extractTitle(body: string): string {
  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : ''
}

function readSkillFile(filePath: string): SkillDoc {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const stem = path.basename(filePath, '.md')
  return {
    id: stem,
    name: data.name || extractTitle(content) || stem,
    description: data.description || '',
    body: content.trim(),
    filePath,
    fileName: path.basename(filePath),
  }
}

export function readSkills(projectPath: string): SkillDoc[] {
  const dir = ensureDir(projectPath)
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      try { return readSkillFile(path.join(dir, f)) } catch { return null }
    })
    .filter((s): s is SkillDoc => s !== null)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

function writeSkillFile(dir: string, skill: Omit<SkillDoc, 'filePath' | 'fileName'>): SkillDoc {
  const fileName = `${skill.id}.md`
  const filePath = path.join(dir, fileName)
  const fileContent = matter.stringify(skill.body, { name: skill.name, description: skill.description })
  fs.writeFileSync(filePath, fileContent, 'utf-8')
  return { ...skill, filePath, fileName }
}

export function createSkill(projectPath: string, name: string): SkillDoc {
  const dir = ensureDir(projectPath)
  const cleanName = name.trim() || 'New skill'
  let id = makeSlug(cleanName)
  // Avoid clobbering an existing skill with the same slug.
  let n = 2
  while (fs.existsSync(path.join(dir, `${id}.md`))) id = `${makeSlug(cleanName)}-${n++}`
  return writeSkillFile(dir, {
    id,
    name: cleanName,
    description: '',
    body: `# ${cleanName}\n\nDescribe when and how an agent should use this skill.\n`,
  })
}

export function updateSkill(
  projectPath: string,
  id: string,
  updates: { name?: string; description?: string; body?: string }
): SkillDoc | null {
  const dir = ensureDir(projectPath)
  const existing = readSkills(projectPath).find(s => s.id === id)
  if (!existing) return null
  const body = updates.body ?? existing.body
  return writeSkillFile(dir, {
    id: existing.id, // keep the slug/filename stable across edits
    name: updates.name?.trim() || extractTitle(body) || existing.name,
    description: updates.description ?? existing.description,
    body,
  })
}

export function deleteSkill(projectPath: string, id: string): void {
  const existing = readSkills(projectPath).find(s => s.id === id)
  if (existing && fs.existsSync(existing.filePath)) fs.unlinkSync(existing.filePath)
}

/**
 * A compact markdown index of installed skills, injected into every agent's
 * managed block so any agent discovers the available skills and where to read
 * the full instructions. Empty string when there are no skills.
 */
export function skillsIndexMarkdown(projectPath: string): string {
  const skills = readSkills(projectPath)
  if (skills.length === 0) return ''
  const lines = skills.map(s => {
    const desc = s.description ? ` — ${s.description}` : ''
    return `- **${s.name}**${desc} (see \`Skills/${s.fileName}\`)`
  })
  return `## Available skills\n\n${lines.join('\n')}`
}
