'use client'

import { AnimatePresence } from 'framer-motion'
import { Titlebar } from './Titlebar'
import { Sidebar } from './Sidebar'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { useUIStore } from '@/lib/store/ui'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const settingsOpen = useUIStore(s => s.settingsOpen)

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <AnimatePresence>{settingsOpen && <SettingsModal />}</AnimatePresence>
    </div>
  )
}
