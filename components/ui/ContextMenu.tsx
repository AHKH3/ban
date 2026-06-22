'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { getContextMenuPosition } from '@/lib/context-menu'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: ReactNode
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
  useEffect(() => {
    const close = () => onClose()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
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
  }, [onClose])

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
          {section.items.map(item => (
            <button
              key={item.id}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect()
                onClose()
              }}
              className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                item.tone === 'danger'
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
              }`}
            >
              {item.icon && (
                <span className="grid h-4 w-4 shrink-0 place-items-center text-current">
                  {item.icon}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </motion.div>,
    document.body,
  )
}
