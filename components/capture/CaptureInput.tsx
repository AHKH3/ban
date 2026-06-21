'use client'

import { useState, useRef, useEffect } from 'react'
import { AddIcon, CaptureIcon } from '@/components/ui/icons'
import { parseCapture } from '@/lib/parse-capture'
import { useT } from '@/lib/i18n'

export function CaptureInput() {
  const t = useT()
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

  const parsed = value.trim() ? parseCapture(value) : null

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

  return (
    <form onSubmit={handleSubmit} className="w-full px-4 py-3 flex items-center gap-3">
      <CaptureIcon size={16} color="var(--accent)" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={t('capture.placeholder')}
        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        disabled={status === 'submitting'}
        autoComplete="off"
        spellCheck={false}
      />
      {parsed && (
        <div className="flex items-center gap-1.5 shrink-0">
          {parsed.status !== 'inbox' && (
            <span className="text-[11px] text-accent border border-accent-border bg-accent-soft rounded px-1.5 py-0.5">
              @{parsed.status}
            </span>
          )}
          {parsed.tags.map(t => (
            <span key={t} className="text-[11px] text-text-muted bg-surface-3 rounded px-1.5 py-0.5">
              #{t}
            </span>
          ))}
        </div>
      )}
      <button
        type="submit"
        disabled={!value.trim() || status === 'submitting' || !projectPath}
        className="shrink-0 p-1.5 rounded bg-accent text-accent-contrast hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {status === 'success' ? '✓' : <AddIcon size={14} color="var(--accent-contrast)" />}
      </button>
    </form>
  )
}
