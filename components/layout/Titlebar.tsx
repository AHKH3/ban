'use client'

import { useEffect, useState } from 'react'
import { SearchIcon } from '@/components/ui/icons'
import { useUIStore } from '@/lib/store/ui'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'
import { motion } from 'framer-motion'

type WindowControlsSide = 'left' | 'right'

type WindowControlsOverlayLike = EventTarget & {
  getTitlebarAreaRect?: () => DOMRectReadOnly
}

type WindowControlsGeometryEvent = Event & {
  titlebarAreaRect?: DOMRectReadOnly
}

function getWindowControlsOverlay() {
  if (typeof navigator === 'undefined') return undefined
  return (navigator as Navigator & { windowControlsOverlay?: WindowControlsOverlayLike }).windowControlsOverlay
}

function getWindowControlsSide(rect?: DOMRectReadOnly): WindowControlsSide {
  if (typeof window === 'undefined' || !rect) return 'right'

  const leftReserved = Math.max(0, rect.x)
  const rightReserved = Math.max(0, window.innerWidth - rect.x - rect.width)

  return leftReserved > rightReserved ? 'left' : 'right'
}

function useWindowControlsSide(): WindowControlsSide {
  const [side, setSide] = useState<WindowControlsSide>('right')

  useEffect(() => {
    const overlay = getWindowControlsOverlay()
    if (!overlay) return

    const update = (rect?: DOMRectReadOnly) => {
      setSide(getWindowControlsSide(rect ?? overlay.getTitlebarAreaRect?.()))
    }

    const onGeometryChange = (event: Event) => {
      update((event as WindowControlsGeometryEvent).titlebarAreaRect)
    }
    const onResize = () => update()

    update()
    overlay.addEventListener('geometrychange', onGeometryChange)
    window.addEventListener('resize', onResize)

    return () => {
      overlay.removeEventListener('geometrychange', onGeometryChange)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return side
}

export function Titlebar() {
  const { openCommandPalette, sidebarCollapsed, toggleSidebar } = useUIStore()
  const { project } = useBoardStore()
  const t = useT()
  const controlsOnLeft = useWindowControlsSide() === 'left'

  return (
    <div className="titlebar-drag relative flex items-center h-10 border-b border-border-subtle bg-surface-1 shrink-0 select-none">
      {/* Sidebar Toggle & Project Name */}
      <div
        className={`titlebar-nodrag absolute top-0 z-20 flex h-10 max-w-[260px] items-center gap-2 ${
          controlsOnLeft ? 'right-0 flex-row-reverse pl-4 pr-3' : 'left-0 pl-3 pr-4'
        }`}
        dir="ltr"
      >
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all active:scale-95 flex items-center justify-center"
          title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          <motion.svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={controlsOnLeft ? 'scale-x-[-1]' : undefined}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <path d="M16 15l-3-3 3-3" />
          </motion.svg>
        </button>
        {project && (
          <span
            className={`min-w-0 max-w-[200px] truncate text-sm font-medium text-text-secondary ${
              controlsOnLeft ? 'border-r border-border-subtle pr-3' : 'border-l border-border-subtle pl-3'
            }`}
            dir="auto"
          >
            {project.name}
          </span>
        )}
      </div>

      {/* Centered Search Button */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 titlebar-nodrag z-10">
        <button
          onClick={openCommandPalette}
          className="flex items-center justify-between gap-1.5 px-3 py-1 rounded bg-surface-2 border border-border-subtle text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-all active:scale-[0.98] text-xs w-[200px] md:w-[260px] group/search"
          title={t('search.label')}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <SearchIcon size={13} className="shrink-0" />
            <span className="truncate">{t('search.placeholder')}</span>
          </div>
          <kbd className="text-[10px] bg-surface-3 border border-border-subtle rounded px-1 shrink-0 group-hover/search:bg-surface-2 transition-colors">Ctrl+K</kbd>
        </button>
      </div>

      <div className="flex-1" />
    </div>
  )
}
