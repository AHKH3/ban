'use client'

import { useEffect, useRef } from 'react'
import { AgentIcon } from './AgentIcon'
import { CloseIcon } from '@/components/ui/icons'
import { useRunsStore } from '@/lib/store/runs'
import { useT } from '@/lib/i18n'
import type { RunStatus } from '@/lib/types'

const STATUS_STYLE: Record<RunStatus, string> = {
  running: 'bg-surface-3 text-warning',
  completed: 'bg-surface-3 text-success',
  failed: 'bg-surface-3 text-danger',
  cancelled: 'bg-surface-3 text-text-muted',
}

function StopGlyph({ size = 10 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor" aria-hidden><rect x="1.5" y="1.5" width="7" height="7" rx="1" /></svg>
}

export function RunPanel() {
  const t = useT()
  const openRunId = useRunsStore(s => s.openRunId)
  const run = useRunsStore(s => (s.openRunId ? s.runs[s.openRunId] : undefined))
  const { openRun, stop } = useRunsStore()
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [run?.lines.length, openRunId])

  if (!openRunId || !run) return null

  const { meta, lines } = run
  const statusLabel = t(`run.status.${meta.status}`)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40" onClick={() => openRun(null)}>
      <div
        className="w-full sm:max-w-2xl h-[70vh] sm:h-[600px] flex flex-col rounded-t-xl sm:rounded-xl border border-border-strong bg-surface-1 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AgentIcon id={meta.agentId} size={16} />
            <span className="text-sm font-medium text-text-primary truncate">{meta.agentName}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLE[meta.status]}`}>{statusLabel}</span>
            <span className="text-xs text-text-muted truncate">· {meta.cardTitle}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {meta.status === 'running' && (
              <button
                onClick={() => stop(meta.id)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted hover:text-danger hover:bg-surface-3 transition-colors"
              >
                <StopGlyph /> {t('run.stop')}
              </button>
            )}
            <button
              onClick={() => openRun(null)}
              className="p-1.5 rounded text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-colors"
              title={t('card.close')}
            >
              <CloseIcon size={15} />
            </button>
          </div>
        </div>

        {/* Live log */}
        <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed bg-bg">
          {lines.length === 0 ? (
            <div className="text-text-muted">{t('run.waiting')}</div>
          ) : (
            lines.map((line, i) => (
              <div
                key={i}
                className={
                  line.stream === 'system' ? 'text-accent whitespace-pre-wrap'
                  : line.stream === 'stderr' ? 'text-danger whitespace-pre-wrap'
                  : 'text-text-secondary whitespace-pre-wrap'
                }
              >
                {line.text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
