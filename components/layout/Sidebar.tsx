'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FolderIcon, AddIcon } from '@/components/ui/icons'
import { BrandMark } from './BrandMark'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'
import type { Project } from '@/lib/types'

export function Sidebar() {
  const { project, openProject } = useBoardStore()
  const [recents, setRecents] = useState<Project[]>([])
  const t = useT()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return
    window.electronAPI.getRecentProjects().then(setRecents)
  }, [project])

  const handleOpenProject = async () => {
    if (typeof window === 'undefined' || !window.electronAPI) return
    const p = await window.electronAPI.openProjectDialog()
    if (p) openProject(p)
  }

  return (
    <motion.div
      initial={{ width: 220 }}
      className="flex flex-col h-full bg-surface-1 border-e border-border-subtle shrink-0"
      style={{ width: 220 }}
    >
      {/* Icon-only brand mark (no wordmark) */}
      <div className="flex items-center px-4 pt-4 pb-3 border-b border-border-subtle">
        <BrandMark size={28} />
      </div>

      <div className="px-3 pt-3 pb-2">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-1 mb-1">{t('projects.heading')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {recents.map(r => (
          <button
            key={r.path}
            onClick={() => openProject(r.path)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors
              ${project?.path === r.path
                ? 'bg-accent-soft text-text-primary'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'}`}
          >
            <FolderIcon size={14} />
            <span className="truncate">{r.name}</span>
          </button>
        ))}
      </div>

      <div className="p-2 border-t border-border-subtle">
        <button
          onClick={handleOpenProject}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-muted hover:bg-surface-2 hover:text-text-secondary transition-colors"
        >
          <AddIcon size={14} />
          <span>{t('projects.open')}</span>
        </button>
      </div>
    </motion.div>
  )
}
