'use client'

import { useState, useRef, useEffect } from 'react'
import { AddIcon, CaptureIcon, FolderIcon } from '@/components/ui/icons'
import { parseCapture } from '@/lib/parse-capture'
import { useT } from '@/lib/i18n'
import { useSettingsStore } from '@/lib/store/settings'
import type { Project } from '@/lib/types'

export function CaptureInput() {
  const t = useT()
  const hydrated = useSettingsStore(s => s.hydrated)
  const [value, setValue] = useState('')
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [projectPickerOpen, setProjectPickerOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'needs-project' | 'submitting' | 'success' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const refreshTarget = async () => {
      inputRef.current?.focus()
      if (typeof window !== 'undefined' && window.electronAPI) {
        const [nextProjectPath, nextRecentProjects] = await Promise.all([
          window.electronAPI.getDefaultProjectPath(),
          window.electronAPI.getRecentProjects(),
        ])
        setProjectPath(nextProjectPath)
        setRecentProjects(nextRecentProjects)
      }
    }
    refreshTarget()
    const unsubscribeCaptureShown = window.electronAPI?.onCaptureShown?.(() => {
      setStatus('idle')
      refreshTarget()
    })
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.closeCaptureWindow()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      unsubscribeCaptureShown?.()
    }
  }, [])

  // Tell the main process the bar has hydrated (theme + RTL applied, styles painted)
  // so it reveals the native window only once — never the raw pre-hydration frame.
  useEffect(() => {
    if (!hydrated) return
    const id = requestAnimationFrame(() => window.electronAPI?.signalCaptureReady?.())
    return () => cancelAnimationFrame(id)
  }, [hydrated])

  const parsed = value.trim() ? parseCapture(value) : null
  const selectedProject = recentProjects.find(project => project.path === projectPath)
  const projectName = projectPath
    ? selectedProject?.name ?? projectPath.split(/[\\/]/).filter(Boolean).pop()
    : null

  const selectProject = async (nextProjectPath: string) => {
    try {
      setStatus('idle')
      await window.electronAPI.openProject(nextProjectPath)
      setProjectPath(nextProjectPath)
      setProjectPickerOpen(false)
      const nextRecentProjects = await window.electronAPI.getRecentProjects()
      setRecentProjects(nextRecentProjects)
      inputRef.current?.focus()
    } catch {
      setStatus('error')
      inputRef.current?.focus()
    }
  }

  const chooseProjectFolder = async () => {
    try {
      const nextProjectPath = await window.electronAPI.openProjectDialog()
      if (nextProjectPath) await selectProject(nextProjectPath)
    } catch {
      setStatus('error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    if (!projectPath) {
      setStatus('needs-project')
      setProjectPickerOpen(true)
      return
    }
    setStatus('submitting')
    try {
      await window.electronAPI.submitCapture(value.trim(), projectPath)
      setStatus('success')
      setTimeout(() => {
        setValue('')
        setStatus('idle')
        window.electronAPI.closeCaptureWindow()
      }, 400)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 1200)
    }
  }

  const canSubmit = !!value.trim() && status !== 'submitting'
  const statusText = status === 'needs-project'
    ? t('capture.pickProject')
    : status === 'submitting'
      ? t('capture.saving')
      : status === 'success'
        ? t('capture.saved')
        : status === 'error'
          ? t('capture.error')
          : ''

  return (
    <form
      onSubmit={handleSubmit}
      dir="ltr"
      className="titlebar-nodrag relative flex flex-1 flex-col justify-center gap-3 px-4 py-4"
    >
      <div id="capture-drag-handle" className="titlebar-drag absolute inset-x-3 top-1 h-3" />

      <div id="capture-target" className="titlebar-nodrag flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
          <span className="grid h-6 w-6 place-items-center rounded-md border border-accent-border bg-accent-soft text-accent">
            <CaptureIcon size={13} />
          </span>
          {t('shortcut.capture')}
        </span>
        <button
          type="button"
          onClick={() => setProjectPickerOpen(open => !open)}
          className="titlebar-nodrag flex min-w-0 max-w-[280px] items-center gap-2 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-3 hover:text-text-primary"
        >
          <FolderIcon size={13} />
          <span className="truncate">{projectName ?? t('capture.chooseProject')}</span>
          <span className="text-[10px] text-text-muted">⌄</span>
        </button>
        {statusText && (
          <span className={`shrink-0 text-[11px] ${status === 'error' || status === 'needs-project' ? 'text-danger' : 'text-text-muted'}`}>
            {statusText}
          </span>
        )}
      </div>

      {projectPickerOpen && (
        <div id="capture-projects" className="titlebar-nodrag flex items-center gap-1.5 overflow-hidden">
          {recentProjects.slice(0, 3).map(project => (
            <button
              key={project.path}
              type="button"
              onClick={() => selectProject(project.path)}
              className={`titlebar-nodrag min-w-0 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                project.path === projectPath
                  ? 'border-accent-border bg-accent-soft text-accent'
                  : 'border-border-subtle bg-transparent text-text-muted hover:border-border-strong hover:text-text-primary'
              }`}
            >
              <span className="block max-w-[130px] truncate">{project.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={chooseProjectFolder}
            className="titlebar-nodrag shrink-0 rounded-md border border-border-subtle bg-transparent px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
          >
            {t('capture.openProject')}
          </button>
        </div>
      )}

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

      {/* Footer: target project + keyboard hints */}
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
