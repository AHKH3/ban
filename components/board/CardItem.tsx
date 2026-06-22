'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CardTypeIcon } from '@/components/card/CardTypeIcon'
import { StatusIcon } from '@/components/card/StatusIcon'
import { useBoardStore } from '@/lib/store/board'
import type { Card, CardStatus } from '@/lib/types'
import { ALL_STATUSES } from '@/lib/types'
import { useT } from '@/lib/i18n'
import { tagColor } from '@/lib/tag-color'
import { formatRelative } from '@/lib/utils'
import { getDraggedCardIds } from '@/lib/card-selection'
import { ContextMenu } from '@/components/ui/ContextMenu'
import { DeleteIcon, EditIcon, TaskIcon } from '@/components/ui/icons'

interface Props {
  card: Card
  onClick: (card: Card) => void
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-danger',
  high: 'bg-warning',
  normal: 'bg-transparent',
  low: 'bg-transparent',
}

const PRIORITY_KEY: Record<string, string> = {
  urgent: 'priority.urgent', high: 'priority.high', normal: 'priority.normal', low: 'priority.low',
}

const STATUS_KEY: Record<CardStatus, string> = {
  inbox: 'column.inbox', shape: 'column.shape', ready: 'column.ready',
  doing: 'column.doing', review: 'column.review', done: 'column.done', killed: 'column.killed',
}

export function CardItem({ card, onClick }: Props) {
  const { moveCard, selectedCardIds, toggleCardSelection, deleteCard } = useBoardStore()
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const isSelected = selectedCardIds.has(card.id)

  // Native HTML5 drag — attached via ref so framer-motion's own onDragStart
  // gesture prop doesn't shadow it.
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onDragStart = (e: DragEvent) => {
      const draggedIds = getDraggedCardIds(card.id, selectedCardIds)
      e.dataTransfer?.setData('text/ban-card-id', card.id)
      e.dataTransfer?.setData('text/ban-card-ids', JSON.stringify(draggedIds))
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
      }

      // Build a styled offscreen clone to use as the drag ghost.
      // This is the only reliable way to produce a custom drag image
      // because the browser captures the element snapshot immediately
      // during the dragstart event — class additions via setTimeout are too late.
      const rect = el.getBoundingClientRect()
      const clone = el.cloneNode(true) as HTMLElement
      clone.style.cssText = [
        `width:${rect.width}px`,
        `position:fixed`,
        `top:-9999px`,
        `left:-9999px`,
        `transform:rotate(3deg) scale(1.04)`,
        `box-shadow:0 20px 60px rgba(0,0,0,0.5),0 4px 12px rgba(0,0,0,0.35)`,
        `border:1px solid var(--accent)`,
        `border-radius:8px`,
        `background:var(--surface-3)`,
        `opacity:0.96`,
        `pointer-events:none`,
      ].join(';')
      document.body.appendChild(clone)

      // Offset so the grab point aligns with where the user clicked
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top
      e.dataTransfer?.setDragImage(clone, offsetX, offsetY)

      // Remove the clone after the browser has captured the drag image
      requestAnimationFrame(() => {
        document.body.removeChild(clone)
        setIsDragging(true)
      })
    }

    const onDragEnd = () => {
      setIsDragging(false)
    }

    el.addEventListener('dragstart', onDragStart)
    el.addEventListener('dragend', onDragEnd)

    return () => {
      el.removeEventListener('dragstart', onDragStart)
      el.removeEventListener('dragend', onDragEnd)
    }
  }, [card.id, selectedCardIds])


  // Click the status icon to advance to the next pipeline status.
  const advanceStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    const i = ALL_STATUSES.indexOf(card.status)
    const next = ALL_STATUSES[(i + 1) % ALL_STATUSES.length]
    moveCard(card.id, next)
  }

  return (
    <motion.div
      layout
      layoutId={`card-${card.id}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.12 }}
      ref={ref}
      draggable
      onContextMenu={e => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({ x: e.clientX, y: e.clientY })
      }}
      onClick={e => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          toggleCardSelection(card.id)
          return
        }
        onClick(card)
      }}
      className={`group/card relative overflow-hidden border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-200 focus:outline-none focus-visible:outline-none
        ${isSelected ? 'border-border-strong bg-surface-3 shadow-md' : 'bg-surface-2'}
        ${isDragging
          ? 'opacity-30 border-dashed border-border-strong bg-surface-1/50 scale-[0.98]'
          : isSelected
            ? 'hover:border-accent-border hover:bg-surface-3'
            : 'border-border-subtle hover:border-border-strong hover:bg-surface-3 hover:-translate-y-0.5 hover:shadow-md active:scale-98'}`}
      aria-selected={isSelected}
    >
      {isSelected && (
        <span
          data-testid="selected-card-check"
          className="pointer-events-none absolute bottom-2 end-2 grid h-5 w-5 place-items-center rounded-full border border-accent-border bg-surface-2 text-accent shadow-sm"
          aria-hidden="true"
        >
          <TaskIcon size={12} color="var(--accent)" strokeWidth={2} />
        </span>
      )}

      {/* Priority dot */}
      {card.priority !== 'normal' && card.priority !== 'low' && (
        <span
          className={`absolute top-3 end-3 w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[card.priority]}`}
          title={t(PRIORITY_KEY[card.priority])}
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-2">
        <button
          onClick={advanceStatus}
          className="mt-0.5 shrink-0 rounded transition-all hover:scale-110 hover:rotate-12 active:scale-90 duration-150"
          title={t('card.status')}
        >
          <StatusIcon status={card.status} size={15} />
        </button>
        <div className="mt-0.5 shrink-0">
          <CardTypeIcon type={card.type} size={13} />
        </div>
        <span className="mt-0.5 shrink-0 rounded border border-border-subtle bg-surface-1 px-1.5 py-0.5 font-mono text-[10px] leading-none text-text-muted">
          {card.id}
        </span>
        <p className="text-sm text-text-primary leading-snug line-clamp-2 flex-1 min-w-0 pe-3">
          {card.title}
        </p>
      </div>

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 ms-10">
          {card.tags.slice(0, 4).map(tag => {
            const c = tagColor(tag)
            return (
              <span
                key={tag}
                className="text-[11px] rounded px-1.5 py-0.5 border transition-all duration-150 hover:scale-105 hover:border-accent-border cursor-default"
                style={{ color: c.text, background: c.bg, borderColor: c.border }}
              >
                #{tag}
              </span>
            )
          })}
          {card.tags.length > 4 && (
            <span className="text-[11px] text-text-muted">+{card.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 ms-10 text-[11px] text-text-muted opacity-0 group-hover/card:opacity-100 transition-opacity">
        {formatRelative(card.updatedAt)}
      </div>

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            sections={[
              {
                id: 'primary',
                items: [
                  {
                    id: 'open',
                    label: t('context.open'),
                    icon: <EditIcon size={14} />,
                    onSelect: () => onClick(card),
                  },
                  {
                    id: 'select',
                    label: isSelected ? t('context.deselect') : t('context.select'),
                    icon: <TaskIcon size={14} />,
                    onSelect: () => toggleCardSelection(card.id),
                  },
                ],
              },
              {
                id: 'move',
                items: ALL_STATUSES.map(status => ({
                  id: `move-${status}`,
                  label: `${t('context.moveTo')} ${t(STATUS_KEY[status])}`,
                  icon: <StatusIcon status={status} size={14} />,
                  disabled: status === card.status,
                  onSelect: () => moveCard(card.id, status),
                })),
              },
              {
                id: 'danger',
                items: [
                  {
                    id: 'delete',
                    label: t('card.delete'),
                    icon: <DeleteIcon size={14} />,
                    tone: 'danger',
                    onSelect: () => {
                      if (window.confirm(t('card.deleteConfirm'))) deleteCard(card.id)
                    },
                  },
                ],
              },
            ]}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
