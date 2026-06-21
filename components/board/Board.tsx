'use client'

import { useRef, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AddIcon } from '@/components/ui/icons'
import { Column } from './Column'
import { CardDetail } from '@/components/card/CardDetail'
import { NewCardModal } from '@/components/card/NewCardModal'
import { useBoardStore } from '@/lib/store/board'
import { useSettingsStore } from '@/lib/store/settings'
import { useT } from '@/lib/i18n'
import { matchesShortcut } from '@/lib/shortcuts'
import { shouldStartBoardPan } from '@/lib/board-pan'
import { ALL_STATUSES } from '@/lib/types'
import type { CardStatus } from '@/lib/types'

export function Board() {
  const { board, selectedCard, selectCard } = useBoardStore()
  const t = useT()
  const newCardShortcut = useSettingsStore(s => s.shortcuts.newCard)
  const [newCardStatus, setNewCardStatus] = useState<CardStatus | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const panRef = useRef<{ pointerId: number; x: number } | null>(null)
  const boardScrollRef = useRef<HTMLDivElement>(null)

  // The physical key opens the new-card modal even when the keyboard layout changes.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!matchesShortcut(e, newCardShortcut)) return
      const el = document.activeElement as HTMLElement | null
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (typing || selectedCard || newCardStatus) return
      e.preventDefault()
      setNewCardStatus('inbox')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedCard, newCardStatus, newCardShortcut])

  if (!board) return null

  return (
    <div className="relative flex h-full overflow-hidden">
      <div
        ref={boardScrollRef}
        className={`flex flex-1 gap-px overflow-x-auto overflow-y-hidden bg-bg pb-0 ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerDown={e => {
          if (e.pointerType !== 'mouse' || !shouldStartBoardPan(e)) return
          panRef.current = { pointerId: e.pointerId, x: e.clientX }
          setIsPanning(true)
          e.currentTarget.setPointerCapture(e.pointerId)
          e.preventDefault()
        }}
        onPointerMove={e => {
          const pan = panRef.current
          if (!pan || pan.pointerId !== e.pointerId) return
          const scrollEl = boardScrollRef.current
          if (!scrollEl) return

          scrollEl.scrollLeft -= e.clientX - pan.x
          pan.x = e.clientX
        }}
        onPointerUp={e => {
          const pan = panRef.current
          if (!pan || pan.pointerId !== e.pointerId) return
          panRef.current = null
          setIsPanning(false)
          e.currentTarget.releasePointerCapture(e.pointerId)
        }}
        onPointerCancel={e => {
          const pan = panRef.current
          if (!pan || pan.pointerId !== e.pointerId) return
          panRef.current = null
          setIsPanning(false)
        }}
      >
        {ALL_STATUSES.map(status => (
          <div key={status} className="group h-full border-e border-border-subtle last:border-e-0 bg-surface-1">
            <Column
              status={status}
              cards={board.columns[status] ?? []}
              onNewCard={setNewCardStatus}
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => setNewCardStatus('inbox')}
        className="absolute bottom-4 end-4 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-contrast text-sm font-medium shadow-lg hover:opacity-90 active:scale-[0.97] transition-all"
        title={t('board.newCard')}
      >
        <AddIcon size={15} color="var(--accent-contrast)" />
        {t('board.newCard')}
      </button>

      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="absolute right-0 top-0 h-full w-[480px] border-l border-border-subtle bg-surface-1 shadow-2xl z-10"
          >
            <CardDetail card={selectedCard} onClose={() => selectCard(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {newCardStatus && (
          <NewCardModal
            initialStatus={newCardStatus}
            onClose={() => setNewCardStatus(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
