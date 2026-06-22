'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MarkdownEditor } from '@/components/card/MarkdownEditor'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'
import { FolderIcon } from '@/components/ui/icons'
import type { FileEntry, FileContent } from '@/lib/types'

function isMarkdown(relPath: string): boolean {
  return /\.(md|markdown)$/i.test(relPath)
}

/** One row in the tree; lazily loads its children the first time it expands. */
function TreeNode({
  entry, depth, projectPath, selected, onSelect,
}: {
  entry: FileEntry
  depth: number
  projectPath: string
  selected: string | null
  onSelect: (e: FileEntry) => void
}) {
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState<FileEntry[] | null>(null)
  const t = useT()

  const toggle = async () => {
    if (entry.isDir) {
      const next = !open
      setOpen(next)
      if (next && children === null) {
        setChildren(await window.electronAPI.listDir(projectPath, entry.relPath))
      }
    } else {
      onSelect(entry)
    }
  }

  const isSel = selected === entry.relPath
  return (
    <div>
      <button
        onClick={toggle}
        style={{ paddingInlineStart: 8 + depth * 12 }}
        className={`w-full flex items-center gap-1.5 pe-2 py-1 rounded text-start text-[13px] transition-colors ${
          isSel ? 'bg-accent-soft text-text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
        }`}
      >
        {entry.isDir ? (
          <>
            <span className={`shrink-0 text-[9px] text-text-muted transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
            <FolderIcon size={13} className="shrink-0 text-text-muted" />
          </>
        ) : (
          <span className="shrink-0 w-[9px]" />
        )}
        <span className="truncate">{entry.name}</span>
      </button>
      {entry.isDir && open && children && (
        <div>
          {children.length === 0 && (
            <div style={{ paddingInlineStart: 8 + (depth + 1) * 12 }} className="py-1 text-[11px] text-text-muted">{t('files.emptyDir')}</div>
          )}
          {children.map(child => (
            <TreeNode key={child.relPath} entry={child} depth={depth + 1} projectPath={projectPath} selected={selected} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileExplorer() {
  const project = useBoardStore(s => s.project)
  const t = useT()
  const [roots, setRoots] = useState<FileEntry[]>([])
  const [selected, setSelected] = useState<FileEntry | null>(null)
  const [file, setFile] = useState<FileContent | null>(null)
  const [text, setText] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!project || !window.electronAPI) return
    window.electronAPI.listDir(project.path, '').then(setRoots)
  }, [project])

  const openFile = useCallback(async (entry: FileEntry) => {
    if (!project) return
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    setSelected(entry)
    const content = await window.electronAPI.readFile(project.path, entry.relPath)
    setFile(content)
    setText(content.content)
    setSavedAt(null)
  }, [project])

  const persist = useCallback((next: string) => {
    setText(next)
    if (!project || !selected) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await window.electronAPI.writeFile(project.path, selected.relPath, next)
      setSavedAt(Date.now())
    }, 600)
  }, [project, selected])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Tree */}
      <div className="w-64 shrink-0 border-e border-border-subtle flex flex-col">
        <div className="px-3 py-3 border-b border-border-subtle">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t('files.title')}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5">
          {project && roots.map(entry => (
            <TreeNode
              key={entry.relPath}
              entry={entry}
              depth={0}
              projectPath={project.path}
              selected={selected?.relPath ?? null}
              onSelect={openFile}
            />
          ))}
        </div>
      </div>

      {/* Editor / viewer */}
      <div className="flex-1 overflow-y-auto">
        {!selected || !file ? (
          <div className="h-full flex items-center justify-center text-text-muted text-sm">{t('files.pick')}</div>
        ) : (
          <div className="max-w-3xl mx-auto px-10 py-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-text-muted truncate">{selected.relPath}</span>
              {savedAt && <span className="text-[11px] text-text-muted shrink-0">{t('files.saved')}</span>}
            </div>
            {file.tooLarge ? (
              <p className="text-sm text-text-muted">{t('files.tooLarge')}</p>
            ) : file.binary ? (
              <p className="text-sm text-text-muted">{t('files.binary')}</p>
            ) : isMarkdown(selected.relPath) ? (
              <MarkdownEditor key={selected.relPath} value={text} onChange={persist} placeholder={t('files.placeholder')} />
            ) : (
              <textarea
                value={text}
                onChange={e => persist(e.target.value)}
                spellCheck={false}
                dir="ltr"
                className="w-full h-[70vh] resize-none bg-surface-1 border border-border-subtle rounded-lg px-4 py-3 text-[13px] text-text-primary font-mono leading-relaxed focus:outline-none focus:border-accent-border"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
