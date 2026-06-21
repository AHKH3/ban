'use client'

import { SettingsIcon } from '@/components/ui/icons'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { useT } from '@/lib/i18n'

export default function SettingsPage() {
  const t = useT()
  return (
    <div className="h-screen flex flex-col bg-bg text-text-primary">
      <div className="titlebar-drag flex items-center px-4 h-10 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2 text-text-secondary">
          <SettingsIcon size={16} />
          <span className="text-sm font-medium">{t('settings.title')}</span>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <SettingsPanel />
      </div>
    </div>
  )
}
