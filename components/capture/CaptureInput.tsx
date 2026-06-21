'use client'

import { useState, useRef, useEffect } from 'react'
import { AddIcon, CaptureIcon, FolderIcon } from '@/components/ui/icons'
import { parseCapture } from '@/lib/parse-capture'
import { useT } from '@/lib/i18n'
import { useSettingsStore } from '@/lib/store/settings'

export function CaptureInput() {
  const t = useT()
  const hydrated = useSettingsStore(s => s.hydrated)
  const [value, setValue] = useState('')
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getDefaultProjectPath().then(setProjectPath)
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.closeCaptureWindow()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Tell the main process the bar has hydrated (theme + RTL applied, styles painted)
  // so it reveals the native window only once — never the raw pre-hydration frame.
  useEffect(() => {
    if (!hydrated) return
    const id = requestAnimationFrame(() => window.electronAPI?.signalCaptureReady?.())
    return () => cancelAnimationFrame(id)
  }, [hydrated])

  const parsed = value.trim() ? parseCapture(value) : null
  const projectName = projectPath
    ? projectPath.split(/[\\/]/).filter(Boolean).pop()
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || !projectPath) return
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

  const canSubmit = !!value.trim() && status !== 'submitting' && !!projectPath

  return (
    <form
      onSubmit={handleSubmit}
      className="titlebar-drag flex flex-1 flex-col justify-center gap-2.5 px-4 py-3.5"
    >
      {/* Input row */}
      <div id="capture-row" className="titlebar-nodrag flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent-border bg-accent-soft">
          <CaptureIcon size={16} color="var(--accent)" />
        </span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={t('capture.placeholder')}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
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
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {status === 'success'
            ? <span className="text-[15px] leading-none">✓</span>
            : <AddIcon size={15} color="var(--accent-contrast)" />}
        </button>
      </div>

      {/* Footer: target project + keyboard hints */}
      <div id="capture-foot" className="titlebar-nodrag flex items-center justify-between gap-3 ps-11 pe-1 text-[11px] text-text-muted">
        <span className="flex min-w-0 items-center gap-1.5">
          <FolderIcon size={12} />
          <span className="truncate">{projectName ?? t('capture.noProject')}</span>
        </span>
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
