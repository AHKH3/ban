'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FolderIcon, AddIcon } from '@/components/ui/icons'
import { BrandMark } from '@/components/layout/BrandMark'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'
import type { Project } from '@/lib/types'
import { formatRelative } from '@/lib/utils'

export function ProjectPicker() {
  const { openProject, isLoading, error } = useBoardStore()
  const [recents, setRecents] = useState<Project[]>([])
  const t = useT()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return
    window.electronAPI.getRecentProjects().then(setRecents)
  }, [])

  const handleOpen = async () => {
    if (typeof window === 'undefined' || !window.electronAPI) return
    const p = await window.electronAPI.openProjectDialog()
    if (p) openProject(p)
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-bg">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm"
      >
        {/* Icon-only brand mark + text wordmark (theme-safe) */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <BrandMark size={56} rounded={14} />
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary leading-none">Ban</h1>
            <p className="text-[11px] text-text-muted mt-1">{t('app.tagline')}</p>
          </div>
        </div>

        {recents.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-text-muted font-medium mb-2 px-1">{t('projects.recent')}</p>
            <div className="space-y-1">
              {recents.slice(0, 5).map(p => (
                <button
                  key={p.path}
                  onClick={() => openProject(p.path)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-1 border border-border-subtle hover:border-border-strong hover:bg-surface-2 transition-all text-left"
                >
                  <FolderIcon size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{p.name}</p>
                    <p className="text-[11px] text-text-muted truncate">{p.path}</p>
                  </div>
                  <span className="text-[11px] text-text-muted shrink-0">{formatRelative(p.lastOpenedAt)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleOpen}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border-strong text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-all disabled:opacity-50"
        >
          <AddIcon size={16} />
          {isLoading ? t('projects.opening') : recents.length === 0 ? t('projects.openFolder') : t('projects.openAnother')}
        </button>

        {error && <p className="mt-3 text-xs text-danger text-center">{error}</p>}

        <p className="mt-6 text-[11px] text-text-muted text-center">
          {t('projects.hint')}
        </p>
      </motion.div>
    </div>
  )
}
