'use client'

import { SearchIcon, SettingsIcon } from '@/components/ui/icons'
import { useUIStore } from '@/lib/store/ui'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'

export function Titlebar() {
  const { openCommandPalette, openSettings } = useUIStore()
  const { project } = useBoardStore()
  const t = useT()

  return (
    <div className="titlebar-drag relative flex items-center h-10 border-b border-border-subtle bg-surface-1 shrink-0 select-none">
      {/* Constrain all interactive content to the area NOT covered by the native
          window controls (they follow text direction, so this stays correct in LTR + RTL). */}
      <div
        className="absolute inset-y-0 flex items-center"
        style={{
          insetInlineStart: 'env(titlebar-area-x, 0px)',
          width: 'env(titlebar-area-width, 100%)',
        }}
      >
      <div className="titlebar-nodrag flex items-center gap-2 ps-3 pe-4">
        {project && (
          <span className="text-sm text-text-secondary font-medium truncate max-w-[200px]">
            {project.name}
          </span>
        )}
      </div>

      <div className="flex-1" />

      <div className="titlebar-nodrag flex items-center gap-1 pe-3">
        <button
          onClick={openCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-colors text-xs"
          title={t('search.label')}
        >
          <SearchIcon size={14} />
          <span>{t('search.label')}</span>
          <kbd className="ms-1 text-[10px] bg-surface-3 border border-border-subtle rounded px-1">⌘K</kbd>
        </button>
        <button
          onClick={openSettings}
          className="p-1.5 rounded text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-colors"
          title={t('settings.title')}
        >
          <SettingsIcon size={15} />
        </button>
      </div>
      </div>
    </div>
  )
}
