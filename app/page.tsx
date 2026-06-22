'use client'

import { useEffect } from 'react'
import { useBoardStore } from '@/lib/store/board'
import { useUIStore } from '@/lib/store/ui'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProjectPicker } from '@/components/projects/ProjectPicker'
import { Board } from '@/components/board/Board'
import { JourneyView } from '@/components/journey/JourneyView'
import { AgentsPanel } from '@/components/agents/AgentsPanel'
import { PlansView } from '@/components/plans/PlansView'
import { FileExplorer } from '@/components/explorer/FileExplorer'
import { SkillsManager } from '@/components/skills/SkillsManager'
import { CommandPalette } from '@/components/search/CommandPalette'
import { matchesShortcut } from '@/lib/shortcuts'
import { useSettingsStore } from '@/lib/store/settings'
import '@/lib/ipc'

export default function Home() {
  const { board, project, openProject, refreshBoard } = useBoardStore()
  const { commandPaletteOpen, activeView } = useUIStore()
  const paletteShortcut = useSettingsStore(s => s.shortcuts.palette)

  // Auto-open last project
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return
    window.electronAPI.getDefaultProjectPath().then(p => {
      if (p) openProject(p)
    })
  }, [openProject])

  // Listen for board changes from file watcher
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return
    const unsub = window.electronAPI.onBoardChanged(() => refreshBoard())
    return unsub
  }, [refreshBoard])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (matchesShortcut(e, paletteShortcut)) {
        e.preventDefault()
        useUIStore.getState().openCommandPalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteShortcut])

  if (!project) {
    return (
      <>
        <ProjectPicker />
        {commandPaletteOpen && <CommandPalette />}
      </>
    )
  }

  return (
    <MainLayout>
      {activeView === 'journey' ? <JourneyView />
        : activeView === 'agents' ? <AgentsPanel />
        : activeView === 'plans' ? <PlansView />
        : activeView === 'files' ? <FileExplorer />
        : activeView === 'skills' ? <SkillsManager />
        : <Board />}
      {commandPaletteOpen && <CommandPalette />}
    </MainLayout>
  )
}
