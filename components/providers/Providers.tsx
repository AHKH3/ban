'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/lib/store/settings'

function syncWindowChrome() {
  if (typeof window === 'undefined' || !window.electronAPI?.setWindowChrome) return
  // Read the resolved theme colors for the native titlebar overlay.
  const cs = getComputedStyle(document.documentElement)
  const bg = cs.getPropertyValue('--surface-1').trim() || '#0F1011'
  const symbol = cs.getPropertyValue('--text-secondary').trim() || '#B7BBC5'
  window.electronAPI.setWindowChrome({ bg, symbol })
}

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useSettingsStore(s => s.hydrate)
  const theme = useSettingsStore(s => s.theme)

  // Sync the zustand store with what the inline boot script already applied.
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Keep native window chrome in sync with the theme.
  useEffect(() => {
    // next tick so the [data-theme] CSS vars are resolved first
    const id = requestAnimationFrame(syncWindowChrome)
    return () => cancelAnimationFrame(id)
  }, [theme])

  return <>{children}</>
}
