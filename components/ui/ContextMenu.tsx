'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { getContextMenuPosition } from '@/lib/context-menu'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: ReactNode
  detail?: ReactNode
  submenu?: ReactNode
  tone?: 'default' | 'danger'
  disabled?: boolean
  onSelect: () => void
}

export interface ContextMenuSection {
  id: string
  items: ContextMenuItem[]
}

interface Props {
  x: number
  y: number
  width?: number
  estimatedHeight?: number
  sections: ContextMenuSection[]
  onClose: () => void
}

export function ContextMenu({
  x,
  y,
  width = 224,
  estimatedHeight = 360,
  sections,
  onClose,
}: Props) {
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null)

  useEffect(() => {
    const close = () => onClose()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeSubmenuId) {
          setActiveSubmenuId(null)
          return
        }
        onClose()
      }
    }

    window.addEventListener('pointerdown', close)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activeSubmenuId, onClose])

  const position = getContextMenuPosition({
    clientX: x,
    clientY: y,
    menuWidth: width,
    menuHeight: estimatedHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  })

  return createPortal(
    <motion.div
      role="menu"
      initial={{ opacity: 0, scale: 0.98, y: -3 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -3 }}
      transition={{ duration: 0.1 }}
      className="fixed z-50 rounded-lg border border-border-strong bg-surface-2/95 p-1.5 text-sm shadow-panel backdrop-blur-xl"
      style={{ left: position.x, top: position.y, width }}
      onContextMenu={event => event.preventDefault()}
      onPointerDown={event => event.stopPropagation()}
    >
      {sections.map((section, sectionIndex) => (
        <div
          key={section.id}
          className={sectionIndex > 0 ? 'mt-1 border-t border-border-subtle pt-1' : undefined}
        >
          {section.items.map(item => {
            const hasSubmenu = Boolean(item.submenu)
            const isSubmenuActive = activeSubmenuId === item.id

            return (
              <div key={item.id} className="relative">
                <button
                  role="menuitem"
                  aria-haspopup={hasSubmenu || undefined}
                  aria-expanded={hasSubmenu ? isSubmenuActive : undefined}
                  disabled={item.disabled}
                  onClick={() => {
                    if (hasSubmenu) {
                      setActiveSubmenuId(current => (current === item.id ? null : item.id))
                      item.onSelect()
                      return
                    }
                    item.onSelect()
                    onClose()
                  }}
                  className={`flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                    item.tone === 'danger'
                      ? 'text-danger hover:bg-danger/10'
                      : isSubmenuActive
                        ? 'bg-surface-3 text-text-primary'
                        : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
                  }`}
                >
                  {item.icon && (
                    <span className="grid h-4 w-4 shrink-0 place-items-center text-current">
                      {item.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.detail && (
                    <span className="ms-2 min-w-0 max-w-[7.5rem] truncate text-xs text-text-muted">
                      {item.detail}
                    </span>
                  )}
                  {hasSubmenu && (
                    <span className="text-xs text-text-muted" aria-hidden="true">
                      ^
                    </span>
                  )}
                </button>

                {hasSubmenu && isSubmenuActive && (
                  <div
                    role="menu"
                    className="absolute bottom-full start-0 z-10 mb-1 min-w-full rounded-lg border border-border-strong bg-surface-2 p-1.5 shadow-panel"
                    onPointerDown={event => event.stopPropagation()}
                  >
                    {item.submenu}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </motion.div>,
    document.body,
  )
}
