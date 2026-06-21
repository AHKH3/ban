'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { SettingsIcon, CloseIcon } from '@/components/ui/icons'
import { SettingsPanel } from './SettingsPanel'
import { useUIStore } from '@/lib/store/ui'
import { useT } from '@/lib/i18n'

export function SettingsModal() {
  const { closeSettings } = useUIStore()
  const t = useT()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSettings() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeSettings])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8"
      onClick={closeSettings}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="flex h-[560px] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border-strong bg-surface-1 shadow-[var(--shadow-panel)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-11 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2 text-text-secondary">
            <SettingsIcon size={16} />
            <span className="text-sm font-medium">{t('settings.title')}</span>
          </div>
          <button
            onClick={closeSettings}
            className="p-1 rounded hover:bg-surface-3 text-text-muted hover:text-text-primary transition-colors"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <SettingsPanel />
        </div>
      </motion.div>
    </div>
  )
}
