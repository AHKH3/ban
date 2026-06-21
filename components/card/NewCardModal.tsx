'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CloseIcon } from '@/components/ui/icons'
import { useBoardStore } from '@/lib/store/board'
import { useSettingsStore } from '@/lib/store/settings'
import { useT } from '@/lib/i18n'
import type { CardStatus, CardType } from '@/lib/types'
import { CARD_TYPE_LABELS, ALL_STATUSES } from '@/lib/types'

const STATUS_KEY: Record<CardStatus, string> = {
  inbox: 'column.inbox', shape: 'column.shape', ready: 'column.ready',
  doing: 'column.doing', review: 'column.review', done: 'column.done', killed: 'column.killed',
}
const TYPE_KEY: Record<CardType, string> = {
  task: 'type.task', idea: 'type.idea', bug: 'type.bug', problem: 'type.problem',
  decision: 'type.decision', question: 'type.question', note: 'type.note',
}

interface Props {
  initialStatus: CardStatus
  onClose: () => void
}

export function NewCardModal({ initialStatus, onClose }: Props) {
  const { createCard } = useBoardStore()
  const t = useT()
  const defaultType = useSettingsStore(s => s.defaultType)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<CardStatus>(initialStatus)
  const [type, setType] = useState<CardType>(defaultType)
  const [tags, setTags] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)
    try {
      const parsedTags = tags
        .split(',')
        .map(t => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean)
      await createCard({ title: title.trim(), status, type, tags: parsedTags })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="bg-surface-1 border border-border-strong rounded-xl shadow-2xl w-full max-w-md p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">{t('newCard.title')}</h2>
          <button onClick={onClose} className="p-1 rounded text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-colors">
            <CloseIcon size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('card.title')}
            className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors"
            required
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1">{t('card.status')}</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as CardStatus)}
                className="w-full bg-surface-2 border border-border-subtle rounded px-2 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent-border"
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{t(STATUS_KEY[s])}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1">{t('card.type')}</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CardType)}
                className="w-full bg-surface-2 border border-border-subtle rounded px-2 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent-border"
              >
                {(Object.keys(CARD_TYPE_LABELS) as CardType[]).map(ct => (
                  <option key={ct} value={ct}>{t(TYPE_KEY[ct])}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">{t('newCard.tagsLabel')}</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="tag1, tag2"
              className="w-full bg-surface-2 border border-border-subtle rounded px-3 py-1.5 text-xs text-text-secondary placeholder:text-text-muted focus:outline-none focus:border-accent-border"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-colors"
            >
              {t('newCard.cancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-1.5 rounded bg-accent text-accent-contrast text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? t('newCard.creating') : t('newCard.create')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
