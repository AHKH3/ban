'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AddIcon } from '@/components/ui/icons'
import { CardItem } from './CardItem'
import { StatusIcon } from '@/components/card/StatusIcon'
import type { Card, CardStatus } from '@/lib/types'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'

interface Props {
  status: CardStatus
  cards: Card[]
  onNewCard?: (status: CardStatus) => void
}

const STATUS_KEY: Record<CardStatus, string> = {
  inbox: 'column.inbox', shape: 'column.shape', ready: 'column.ready',
  doing: 'column.doing', review: 'column.review', done: 'column.done', killed: 'column.killed',
}

export function Column({ status, cards, onNewCard }: Props) {
  const { selectCard, moveCard, moveCards } = useBoardStore()
  const t = useT()
  const [isOver, setIsOver] = useState(false)
  const label = t(STATUS_KEY[status])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)
    const ids = parseDraggedCardIds(e.dataTransfer)
    if (ids.length > 0) {
      moveCards(ids, status)
      return
    }
    const id = e.dataTransfer.getData('text/ban-card-id')
    if (id) moveCard(id, status)
  }

  return (
    <div
      className={`flex flex-col w-72 shrink-0 h-full transition-all duration-200 border-x border-transparent ${
        isOver 
          ? 'bg-accent-soft/20 border-accent-border/40 shadow-[0_0_12px_rgba(94,106,210,0.06)]' 
          : ''
      }`}
      onDragOver={e => {
        if (!hasDraggedCards(e.dataTransfer)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (!isOver) setIsOver(true)
      }}
      onDragLeave={e => {
        // only clear when leaving the column entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsOver(false)
      }}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <StatusIcon status={status} size={14} />
          <span className="text-sm font-medium text-text-primary">{label}</span>
          <span className="text-xs text-text-muted bg-surface-3 rounded px-1.5 py-0.5 min-w-[20px] text-center">
            {cards.length}
          </span>
        </div>
        {onNewCard && (
          <button
            onClick={() => onNewCard(status)}
            className="p-1 rounded text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="New card"
          >
            <AddIcon size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 column-scroll px-2 pb-3 space-y-2">
        <AnimatePresence initial={false}>
          {cards.map(card => (
            <CardItem key={card.id} card={card} onClick={selectCard} />
          ))}
        </AnimatePresence>

        {cards.length === 0 && (
          <div className="flex items-center justify-center h-16 border border-dashed border-border-subtle/50 rounded-lg bg-surface-2/10 transition-colors">
            <span className="text-xs text-text-muted/80">{t('board.empty')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function hasDraggedCards(dataTransfer: DataTransfer) {
  return dataTransfer.types.includes('text/ban-card-ids') || dataTransfer.types.includes('text/ban-card-id')
}

function parseDraggedCardIds(dataTransfer: DataTransfer) {
  const raw = dataTransfer.getData('text/ban-card-ids')
  if (!raw) return []

  try {
    const ids = JSON.parse(raw)
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}
