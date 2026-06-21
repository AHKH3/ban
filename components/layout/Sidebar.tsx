'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FolderIcon, AddIcon, SettingsIcon, BoardIcon, DecisionIcon } from '@/components/ui/icons'
import { BrandMark } from './BrandMark'
import { useBoardStore } from '@/lib/store/board'
import { useUIStore } from '@/lib/store/ui'
import { useT } from '@/lib/i18n'
import type { Project } from '@/lib/types'

export function Sidebar() {
  const { project, openProject } = useBoardStore()
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed)
  const openSettings = useUIStore(s => s.openSettings)
  const activeView = useUIStore(s => s.activeView)
  const showBoard = useUIStore(s => s.showBoard)
  const showJourney = useUIStore(s => s.showJourney)
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
      initial={false}
      animate={{
        width: sidebarCollapsed ? 0 : 220,
        opacity: sidebarCollapsed ? 0 : 1,
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`flex flex-col h-full bg-surface-1 shrink-0 overflow-hidden ${
        sidebarCollapsed ? 'border-e-0' : 'border-e border-border-subtle'
      }`}
    >
      {/* Icon-only brand mark (no wordmark) */}
      <div className="flex items-center px-4 pt-4 pb-3 border-b border-border-subtle">
        <BrandMark size={28} />
      </div>

      <div className="px-3 pt-3 pb-2">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-1 mb-1">{t('projects.heading')}</p>
      </div>

      {project && (
        <div className="px-2 pb-3 space-y-0.5 border-b border-border-subtle">
          <button
            onClick={showBoard}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-start text-sm transition-all active:scale-98 ${
              activeView === 'board'
                ? 'bg-accent-soft text-text-primary font-medium'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
            }`}
          >
            <BoardIcon size={14} className={activeView === 'board' ? 'text-accent' : 'text-text-muted'} />
            <span className="truncate ps-1.5">{t('nav.board')}</span>
          </button>
          <button
            onClick={showJourney}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-start text-sm transition-all active:scale-98 ${
              activeView === 'journey'
                ? 'bg-accent-soft text-text-primary font-medium'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
            }`}
          >
            <DecisionIcon size={14} className={activeView === 'journey' ? 'text-accent' : 'text-text-muted'} />
            <span className="truncate ps-1.5">{t('nav.journey')}</span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {recents.map(r => {
          const isActive = project?.path === r.path
          return (
            <button
              key={r.path}
              onClick={() => openProject(r.path)}
              className={`group/proj w-full flex items-center gap-2 px-2 py-1.5 rounded text-start text-sm transition-all relative overflow-hidden active:scale-98
                ${isActive
                  ? 'bg-accent-soft text-text-primary font-medium'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'}`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeProjectIndicator"
                  className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 bg-accent rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <FolderIcon size={14} className={isActive ? 'text-accent' : 'text-text-muted group-hover/proj:text-text-secondary transition-colors'} />
              <span className="truncate ps-1.5">{r.name}</span>
            </button>
          )
        })}
      </div>

      <div className="p-2 border-t border-border-subtle flex items-center gap-2">
        <button
          onClick={handleOpenProject}
          className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-muted hover:bg-surface-2 hover:text-text-secondary transition-all active:scale-95"
        >
          <AddIcon size={14} />
          <span className="truncate">{t('projects.open')}</span>
        </button>
        <button
          onClick={openSettings}
          className="p-1.5 rounded text-text-muted hover:bg-surface-2 hover:text-text-secondary hover:bg-surface-3 transition-all active:scale-95 shrink-0"
          title={t('settings.title')}
        >
          <SettingsIcon size={15} />
        </button>
      </div>
    </motion.div>
  )
}
