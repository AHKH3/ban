'use client'

import { useEffect, useState, useRef } from 'react'
import { AgentIcon } from './AgentIcon'
import { useRunsStore } from '@/lib/store/runs'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'
import type { Card } from '@/lib/types'

function PlayGlyph({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor" aria-hidden><path d="M2 1.2v7.6L8.4 5z" /></svg>
}
function StopGlyph({ size = 10 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor" aria-hidden><rect x="1.5" y="1.5" width="7" height="7" rx="1" /></svg>
}

export function RunButton({ card }: { card: Card }) {
  const t = useT()
  const projectPath = useBoardStore(s => s.project?.path)
  const { available, ensureSubscribed, detect, start, stop, openRun } = useRunsStore()
  const run = useRunsStore(s => {
    const id = s.activeByCard[card.id]
    return id ? s.runs[id] : undefined
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ensureSubscribed()
    if (available === null) detect()
  }, [available, detect, ensureSubscribed])

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const installed = (available ?? []).filter(a => a.available)
  const isRunning = run?.meta.status === 'running'

  if (isRunning && run) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => openRun(run.meta.id)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-accent-soft text-accent hover:opacity-90 transition-opacity"
          title={t('run.viewLive')}
        >
          <AgentIcon id={run.meta.agentId} size={13} />
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            {t('run.running')}
          </span>
        </button>
        <button
          onClick={() => stop(run.meta.id)}
          className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-surface-3 transition-colors"
          title={t('run.stop')}
        >
          <StopGlyph />
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setMenuOpen(o => !o)}
        disabled={installed.length === 0}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-surface-3 text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={installed.length === 0 ? t('run.noAgents') : t('run.assign')}
      >
        <PlayGlyph />
        {t('run.run')}
      </button>

      {menuOpen && installed.length > 0 && (
        <div className="absolute z-30 mt-1 end-0 min-w-[180px] rounded-md border border-border-strong bg-surface-1 shadow-lg py-1">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-text-muted">{t('run.assignTo')}</div>
          {installed.map(agent => (
            <button
              key={agent.id}
              onClick={() => {
                if (projectPath) start(projectPath, card.id, agent.id)
                setMenuOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors text-start"
            >
              <AgentIcon id={agent.id} size={15} />
              <span className="flex-1">{agent.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
