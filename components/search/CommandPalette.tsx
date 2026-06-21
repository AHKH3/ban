'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { SearchIcon, CloseIcon } from '@/components/ui/icons'
import { useUIStore } from '@/lib/store/ui'
import { useBoardStore } from '@/lib/store/board'
import { CardTypeIcon } from '@/components/card/CardTypeIcon'
import { useT } from '@/lib/i18n'
import type { SearchResult, CardStatus } from '@/lib/types'

const STATUS_KEY: Record<CardStatus, string> = {
  inbox: 'column.inbox', shape: 'column.shape', ready: 'column.ready',
  doing: 'column.doing', review: 'column.review', done: 'column.done', killed: 'column.killed',
}

export function CommandPalette() {
  const { closeCommandPalette } = useUIStore()
  const { project, selectCard, board } = useBoardStore()
  const t = useT()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!query.trim() || !project) { setResults([]); return }
    const timer = setTimeout(async () => {
      if (typeof window === 'undefined' || !window.electronAPI) return
      const r = await window.electronAPI.searchCards(query, project.path)
      setResults(r)
      setActiveIndex(0)
    }, 120)
    return () => clearTimeout(timer)
  }, [query, project])

  const openCard = (result: SearchResult) => {
    if (!board) return
    for (const cards of Object.values(board.columns)) {
      const card = cards.find(c => c.id === result.id)
      if (card) { selectCard(card); closeCommandPalette(); return }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeCommandPalette()
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[activeIndex]) openCard(results[activeIndex])
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm"
      onClick={closeCommandPalette}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: -8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: -8 }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="bg-surface-1 border border-border-strong rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <SearchIcon size={16} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-secondary">
              <CloseIcon size={14} />
            </button>
          )}
          <kbd className="text-[10px] text-text-muted border border-border-subtle rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        {results.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto divide-y divide-border-subtle">
            {results.map((r, i) => (
              <li
                key={r.id}
                className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                  i === activeIndex ? 'bg-surface-2' : 'hover:bg-surface-2'
                }`}
                onClick={() => openCard(r)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <div className="mt-0.5"><CardTypeIcon type={r.type} size={13} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{r.title}</p>
                  {r.excerpt && <p className="text-xs text-text-muted truncate mt-0.5">{r.excerpt}</p>}
                </div>
                <span className="text-[11px] text-text-muted shrink-0 mt-0.5">{t(STATUS_KEY[r.status])}</span>
              </li>
            ))}
          </ul>
        ) : query.trim() ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">{t('search.noResults')} &ldquo;{query}&rdquo;</div>
        ) : (
          <div className="px-4 py-6 text-center text-xs text-text-muted">
            {t('search.hint')}
          </div>
        )}
      </motion.div>
    </div>
  )
}
