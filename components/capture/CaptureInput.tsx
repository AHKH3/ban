'use client'

import { useState, useRef, useEffect } from 'react'
import { AddIcon, CaptureIcon, FolderIcon } from '@/components/ui/icons'
import { parseCapture } from '@/lib/parse-capture'
import { useT } from '@/lib/i18n'
import { useSettingsStore } from '@/lib/store/settings'
import type { Card } from '@/lib/types'

// ── Direct localStorage persistence (no Electron dependency) ────────────────
const LS_RECENTS  = 'ban-capture-recents'
const LS_DEFAULT  = 'ban-capture-default'
const LS_CAPTURES = 'ban-pending-captures'

interface LocalProject { path: string; name: string; lastOpenedAt: string }

function lsGet<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch { return fallback }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota */ }
}

function getRecent(): LocalProject[] { return lsGet<LocalProject[]>(LS_RECENTS, []) }
function saveRecent(p: LocalProject) {
  const list = getRecent().filter(x => x.path !== p.path)
  list.unshift(p)
  lsSet(LS_RECENTS, list.slice(0, 10))
  lsSet(LS_DEFAULT, p.path)
}
function getDefaultPath(): string | null { return lsGet<string | null>(LS_DEFAULT, null) }
function makeProject(path: string, name: string): LocalProject {
  return { path, name, lastOpenedAt: new Date().toISOString() }
}

// ── Electron IPC helper (graceful fallback) ─────────────────────────────────
function electra<T>(path: string, ...args: unknown[]): Promise<T | null> {
  if (typeof window === 'undefined' || !(window as any).electronAPI) return Promise.resolve(null)
  try {
    return (window as any).electronAPI[path](...args)
  } catch { return Promise.resolve(null) }
}

export function CaptureInput() {
  const t = useT()
  const hydrated = useSettingsStore(s => s.hydrated)

  const [value, setValue] = useState('')
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [recentProjects, setRecentProjects] = useState<LocalProject[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerInput, setPickerInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'needs-project' | 'submitting' | 'success' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // ── Load saved state on mount ────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus()
    setProjectPath(getDefaultPath())
    setRecentProjects(getRecent())
    electra('signalCaptureReady')
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPickerOpen(false)
        electra('closeCaptureWindow')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Close picker on outside click ────────────────────────────────────────
  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    // Delay attaching so the opening click itself doesn't close it
    const id = requestAnimationFrame(() => document.addEventListener('click', handler))
    return () => { cancelAnimationFrame(id); document.removeEventListener('click', handler) }
  }, [pickerOpen])

  // ── Derived ──────────────────────────────────────────────────────────────
  const parsed = value.trim() ? parseCapture(value) : null
  const selectedProject = recentProjects.find(p => p.path === projectPath)
  const projectName = projectPath
    ? selectedProject?.name ?? projectPath.split(/[\\/]/).filter(Boolean).pop()
    : null

  const selectProject = (next: string) => {
    const name = next.split(/[\\/]/).filter(Boolean).pop() || next
    const p = makeProject(next, name)
    saveRecent(p)
    setProjectPath(next)
    setRecentProjects(getRecent())
    setPickerOpen(false)
    setPickerInput('')
    inputRef.current?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    if (!projectPath) {
      setStatus('needs-project')
      setPickerOpen(true)
      return
    }
    setStatus('submitting')
    try {
      // Try Electron IPC first, fall back to localStorage
      const ok = await electra('submitCapture', value.trim(), projectPath)
      if (!ok) {
        // Browser fallback — stash in localStorage
        const stash = lsGet<any[]>(LS_CAPTURES, [])
        stash.push({
          id: `cap_${Date.now()}`,
          title: value.trim().split('\n')[0].slice(0, 80),
          body: value.trim(),
          projectPath,
          status: 'inbox',
          type: 'task',
          createdAt: new Date().toISOString(),
        })
        lsSet(LS_CAPTURES, stash)
      }
      setStatus('success')
      setValue('')
      setTimeout(() => {
        setStatus('idle')
        electra('closeCaptureWindow')
      }, 400)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 1200)
    }
  }

  const canSubmit = !!value.trim() && status !== 'submitting'
  const statusText =
    status === 'needs-project' ? t('capture.pickProject') :
    status === 'submitting'     ? t('capture.saving') :
    status === 'success'        ? t('capture.saved') :
    status === 'error'          ? t('capture.error') : ''

  return (
    <form
      onSubmit={handleSubmit}
      dir="ltr"
      className="titlebar-nodrag relative flex flex-1 flex-col justify-center gap-3 px-4 py-4"
    >
      <div id="capture-drag-handle" className="titlebar-drag absolute inset-x-3 top-1 h-3" />

      {/* ── Top bar: label + project picker ──────────────────────────────── */}
      <div id="capture-target" className="titlebar-nodrag flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
          <span className="grid h-6 w-6 place-items-center rounded-md border border-accent-border bg-accent-soft text-accent">
            <CaptureIcon size={13} />
          </span>
          {t('shortcut.capture')}
        </span>
        <div ref={pickerRef} className="relative">
          <button
            id="capture-project-btn"
            type="button"
            onClick={() => setPickerOpen(o => !o)}
            className="titlebar-nodrag flex min-w-0 max-w-[280px] items-center gap-2 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-3 hover:text-text-primary"
          >
            <FolderIcon size={13} />
            <span className="truncate">{projectName ?? t('capture.chooseProject')}</span>
            <span className="text-[10px] text-text-muted">⌄</span>
          </button>

          {/* ── Dropdown picker ──────────────────────────────────────────── */}
          {pickerOpen && (
            <div
              id="capture-picker-dropdown"
              className="titlebar-nodrag absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-lg border border-border-subtle bg-surface-2 shadow-xl"
            >
              {/* Recent projects */}
              {recentProjects.length > 0 && (
                <div className="max-h-40 overflow-y-auto border-b border-border-subtle p-1">
                  {recentProjects.map(p => (
                    <button
                      key={p.path}
                      type="button"
                      onClick={() => selectProject(p.path)}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                        p.path === projectPath
                          ? 'bg-accent-soft text-accent'
                          : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
                      }`}
                    >
                      <FolderIcon size={12} />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      {p.path === projectPath && <span className="text-[10px] text-accent">✓</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* New / custom project */}
              <div className="flex items-center gap-1.5 p-2">
                <input
                  type="text"
                  value={pickerInput}
                  onChange={e => setPickerInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && pickerInput.trim()) {
                      selectProject(pickerInput.trim())
                    }
                  }}
                  placeholder={t('capture.openProject')}
                  className="min-w-0 flex-1 rounded-md border border-border-subtle bg-surface-3 px-2.5 py-1.5 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent-border"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => pickerInput.trim() && selectProject(pickerInput.trim())}
                  disabled={!pickerInput.trim()}
                  className="shrink-0 rounded-md bg-accent px-2.5 py-1.5 text-xs text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {t('capture.save')}
                </button>
              </div>
            </div>
          )}
        </div>
        {statusText && (
          <span className={`shrink-0 text-[11px] ${status === 'error' || status === 'needs-project' ? 'text-danger' : 'text-text-muted'}`}>
            {statusText}
          </span>
        )}
      </div>

      {/* ── Input row ────────────────────────────────────────────────────── */}
      <div id="capture-row" className="titlebar-nodrag flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-2 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={t('capture.placeholder')}
          dir="auto"
          className="titlebar-nodrag min-w-0 flex-1 bg-transparent px-2 text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
          disabled={status === 'submitting'}
          autoComplete="off"
          spellCheck={false}
        />

        {parsed && (parsed.status !== 'inbox' || parsed.tags.length > 0) && (
          <div className="flex shrink-0 items-center gap-1.5">
            {parsed.status !== 'inbox' && (
              <span className="rounded border border-accent-border bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent">
                @{parsed.status}
              </span>
            )}
            {parsed.tags.slice(0, 3).map(tag => (
              <span key={tag} className="rounded bg-surface-3 px-1.5 py-0.5 text-[11px] text-text-muted">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="titlebar-nodrag grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-contrast shadow-[0_8px_22px_rgba(94,106,210,.24)] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {status === 'success'
            ? <span className="text-[15px] leading-none">✓</span>
            : <AddIcon size={15} color="var(--accent-contrast)" />}
        </button>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div id="capture-foot" className="titlebar-nodrag flex items-center justify-between gap-3 px-1 text-[11px] text-text-muted">
        <span className="min-w-0 truncate">{projectPath ?? t('capture.noProject')}</span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-border-subtle px-1.5 py-0.5 text-[10px] leading-none">↵</kbd>
            {t('capture.save')}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-border-subtle px-1.5 py-0.5 text-[10px] leading-none">esc</kbd>
            {t('capture.dismiss')}
          </span>
        </span>
      </div>
    </form>
  )
}
