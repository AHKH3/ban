'use client'

import { useState, useEffect } from 'react'
import { CloseIcon, DeleteIcon, SaveIcon } from '@/components/ui/icons'
import { MarkdownEditor } from './MarkdownEditor'
import { CardTypeIcon } from './CardTypeIcon'
import { StatusButton } from './StatusButton'
import { RunButton } from '@/components/runs/RunButton'
import { useBoardStore } from '@/lib/store/board'
import { useSettingsStore } from '@/lib/store/settings'
import { useT } from '@/lib/i18n'
import { matchesShortcut } from '@/lib/shortcuts'
import type { Card, CardStatus, CardType, CardPriority } from '@/lib/types'
import {
  CARD_TYPE_LABELS, PRIORITY_LABELS,
} from '@/lib/types'

const TYPE_KEY: Record<CardType, string> = {
  task: 'type.task', idea: 'type.idea', bug: 'type.bug', problem: 'type.problem',
  decision: 'type.decision', question: 'type.question', note: 'type.note',
}
const PRIORITY_KEY: Record<CardPriority, string> = {
  urgent: 'priority.urgent', high: 'priority.high', normal: 'priority.normal', low: 'priority.low',
}

interface Props {
  card: Card
  onClose: () => void
}

export function CardDetail({ card, onClose }: Props) {
  const { updateCard, deleteCard } = useBoardStore()
  const t = useT()
  const saveShortcut = useSettingsStore(s => s.shortcuts.save)
  const [title, setTitle] = useState(card.title)
  const [body, setBody] = useState(card.body)
  const [type, setType] = useState<CardType>(card.type)
  const [status, setStatus] = useState<CardStatus>(card.status)
  const [priority, setPriority] = useState<CardPriority>(card.priority)
  const [tagInput, setTagInput] = useState(card.tags.join(', '))
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTitle(card.title)
    setBody(card.body)
    setType(card.type)
    setStatus(card.status)
    setPriority(card.priority)
    setTagInput(card.tags.join(', '))
    setIsDirty(false)
  }, [card.id])

  const markDirty = () => setIsDirty(true)

  const parsedTags = tagInput
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/^#/, ''))
    .filter(Boolean)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateCard(card.id, {
        title: title.trim() || t('card.untitled'),
        body,
        type,
        status,
        priority,
        tags: parsedTags,
      })
      setIsDirty(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('card.deleteConfirm'))) return
    await deleteCard(card.id)
    onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (matchesShortcut(e, saveShortcut)) {
        e.preventDefault()
        if (isDirty) handleSave()
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <CardTypeIcon type={type} size={15} />
          <select
            value={type}
            onChange={e => { setType(e.target.value as CardType); markDirty() }}
            className="text-xs bg-transparent border-none text-text-muted focus:outline-none cursor-pointer hover:text-text-secondary"
          >
            {(Object.keys(CARD_TYPE_LABELS) as CardType[]).map(ct => (
              <option key={ct} value={ct}>{t(TYPE_KEY[ct])}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <RunButton card={card} />
          {isDirty && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-accent text-accent-contrast hover:opacity-90 transition-opacity"
            >
              <SaveIcon size={12} color="var(--accent-contrast)" />
              {isSaving ? t('card.saving') : t('card.save')}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-surface-3 transition-colors"
            title={t('card.delete')}
          >
            <DeleteIcon size={15} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-colors"
            title={t('card.close')}
          >
            <CloseIcon size={15} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-5 pt-4 pb-2 shrink-0">
        <textarea
          value={title}
          onChange={e => { setTitle(e.target.value); markDirty() }}
          className="w-full text-lg font-semibold text-text-primary bg-transparent resize-none focus:outline-none leading-snug"
          rows={2}
          placeholder={t('card.title')}
        />
      </div>

      {/* Metadata strip */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 shrink-0">
        <StatusButton value={status} onChange={s => { setStatus(s); markDirty() }} />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted">{t('card.priority')}</span>
          <select
            value={priority}
            onChange={e => { setPriority(e.target.value as CardPriority); markDirty() }}
            className="text-xs bg-surface-3 border border-border-subtle rounded px-1.5 py-0.5 text-text-secondary focus:outline-none focus:border-accent-border cursor-pointer"
          >
            {(Object.keys(PRIORITY_LABELS) as CardPriority[]).map(p => (
              <option key={p} value={p}>{t(PRIORITY_KEY[p])}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs text-text-muted shrink-0">{t('card.tags')}</span>
          <input
            type="text"
            value={tagInput}
            onChange={e => { setTagInput(e.target.value); markDirty() }}
            placeholder="tag1, tag2"
            className="flex-1 min-w-0 text-xs bg-surface-3 border border-border-subtle rounded px-1.5 py-0.5 text-text-secondary focus:outline-none focus:border-accent-border placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Body editor — live inline Markdown */}
      <div className="flex flex-col flex-1 border-t border-border-subtle min-h-0">
        <MarkdownEditor
          key={card.id}
          value={body}
          onChange={v => { setBody(v); markDirty() }}
          placeholder={t('card.bodyPlaceholder')}
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t border-border-subtle shrink-0 flex items-center gap-3 text-[11px] text-text-muted">
        <span>ID: {card.id}</span>
        <span>·</span>
        <span>{t('card.updated')} {new Date(card.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
