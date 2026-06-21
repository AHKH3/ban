'use client'

import { create } from 'zustand'

interface UIStore {
  commandPaletteOpen: boolean
  settingsOpen: boolean
  sidebarCollapsed: boolean

  openCommandPalette(): void
  closeCommandPalette(): void
  openSettings(): void
  closeSettings(): void
  toggleSidebar(): void
}

export const useUIStore = create<UIStore>(set => ({
  commandPaletteOpen: false,
  settingsOpen: false,
  sidebarCollapsed: false,

  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
