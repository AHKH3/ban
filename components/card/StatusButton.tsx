'use client'

import { useState, useRef, useEffect } from 'react'
import { StatusIcon } from './StatusIcon'
import { useT } from '@/lib/i18n'
import { ALL_STATUSES } from '@/lib/types'
import type { CardStatus } from '@/lib/types'

interface Props {
  value: CardStatus
  onChange: (status: CardStatus) => void
  size?: number
  showLabel?: boolean
}

const STATUS_KEY: Record<CardStatus, string> = {
  inbox: 'column.inbox',
  shape: 'column.shape',
  ready: 'column.ready',
  doing: 'column.doing',
  review: 'column.review',
  done: 'column.done',
  killed: 'column.killed',
}

export function StatusButton({ value, onChange, size = 16, showLabel = true }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs text-text-secondary hover:bg-surface-3 transition-colors"
        title={t(STATUS_KEY[value])}
      >
        <StatusIcon status={value} size={size} />
        {showLabel && <span>{t(STATUS_KEY[value])}</span>}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 min-w-[180px] start-0 rounded-lg border border-border-strong bg-surface-1 p-1 shadow-[var(--shadow-panel)] animate-[fade-in_var(--motion-fast)_var(--ease-out)]">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false) }}
              className={`flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-start text-sm transition-colors ${
                s === value ? 'bg-surface-2 text-text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              <StatusIcon status={s} size={16} />
              <span>{t(STATUS_KEY[s])}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
