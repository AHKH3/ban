import * as fs from 'fs'
import * as path from 'path'
import type { FileEntry, FileContent } from '../../lib/types'

// Folders that are noise for a source-of-truth view (build output, VCS, deps,
// Ban's own hidden app data). Everything else — including Tasks/, Plans/,
// RULES.md, CLAUDE.md — stays visible.
const IGNORED = new Set([
  'node_modules', '.git', '.next', 'dist', 'dist-electron', 'out',
  '.ban', '.DS_Store', '.cache', 'coverage',
])

const MAX_TEXT_BYTES = 1024 * 1024 // 1 MB — bigger files aren't opened inline.

/** Resolve a project-relative path and refuse anything that escapes the root. */
function resolveSafe(projectPath: string, relPath: string): string {
  const abs = path.resolve(projectPath, relPath)
  const rel = path.relative(projectPath, abs)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path is outside the project')
  }
  return abs
}

function toPosix(rel: string): string {
  return rel.split(path.sep).join('/')
}

/** List the immediate children of a directory (lazy — one level at a time). */
export function listDir(projectPath: string, relPath = ''): FileEntry[] {
  const abs = resolveSafe(projectPath, relPath)
  let names: string[]
  try {
    names = fs.readdirSync(abs)
  } catch {
    return []
  }

  const entries: FileEntry[] = []
  for (const name of names) {
    if (IGNORED.has(name)) continue
    let isDir = false
    try {
      isDir = fs.statSync(path.join(abs, name)).isDirectory()
    } catch {
      continue
    }
    entries.push({ name, relPath: toPosix(path.join(relPath, name)), isDir })
  }

  // Directories first, then files; each alphabetical (case-insensitive).
  return entries.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

export function readTextFile(projectPath: string, relPath: string): FileContent {
  const abs = resolveSafe(projectPath, relPath)
  const stat = fs.statSync(abs)
  if (stat.size > MAX_TEXT_BYTES) {
    return { relPath, content: '', binary: false, tooLarge: true }
  }
  const buf = fs.readFileSync(abs)
  // Heuristic: a NUL byte in the first chunk means it's not text we should edit.
  const binary = buf.subarray(0, 8000).includes(0)
  return {
    relPath,
    content: binary ? '' : buf.toString('utf-8'),
    binary,
    tooLarge: false,
  }
}

export function writeTextFile(projectPath: string, relPath: string, content: string): void {
  const abs = resolveSafe(projectPath, relPath)
  fs.writeFileSync(abs, content, 'utf-8')
}
