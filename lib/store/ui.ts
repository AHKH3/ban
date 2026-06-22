'use client'

import { create } from 'zustand'

export type AppView = 'board' | 'journey' | 'agents' | 'plans' | 'files' | 'skills'

interface UIStore {
  commandPaletteOpen: boolean
  settingsOpen: boolean
  sidebarCollapsed: boolean
  activeView: AppView

  openCommandPalette(): void
  closeCommandPalette(): void
  openSettings(): void
  closeSettings(): void
  toggleSidebar(): void
  setView(view: AppView): void
  showBoard(): void
  showJourney(): void
}

export const useUIStore = create<UIStore>(set => ({
  commandPaletteOpen: false,
  settingsOpen: false,
  sidebarCollapsed: false,
  activeView: 'board',

  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setView: (view) => set({ activeView: view }),
  showBoard: () => set({ activeView: 'board' }),
  showJourney: () => set({ activeView: 'journey' }),
}))
