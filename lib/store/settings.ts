'use client'

import { create } from 'zustand'
import type { CardType } from '@/lib/types'
import { DEFAULT_SHORTCUTS } from '@/lib/shortcuts'
import type { ShortcutAction, ShortcutBinding, ShortcutMap } from '@/lib/shortcuts'

export type ThemeId = 'dark-soft' | 'dark-oled' | 'light-white' | 'light-paper'
export type Lang = 'en' | 'ar'

export const THEMES: { id: ThemeId; mode: 'dark' | 'light'; labelKey: string }[] = [
  { id: 'dark-soft', mode: 'dark', labelKey: 'settings.themeDarkSoft' },
  { id: 'dark-oled', mode: 'dark', labelKey: 'settings.themeDarkOled' },
  { id: 'light-white', mode: 'light', labelKey: 'settings.themeLightWhite' },
  { id: 'light-paper', mode: 'light', labelKey: 'settings.themeLightPaper' },
]

interface PersistedSettings {
  theme: ThemeId
  lang: Lang
  defaultType: CardType
  shortcuts: ShortcutMap
}

const STORAGE_KEY = 'ban-settings'
const DEFAULTS: PersistedSettings = {
  theme: 'dark-soft',
  lang: 'en',
  defaultType: 'task',
  shortcuts: DEFAULT_SHORTCUTS,
}

function normalizeShortcuts(value: unknown): ShortcutMap {
  if (!value || typeof value !== 'object') return DEFAULT_SHORTCUTS
  return { ...DEFAULT_SHORTCUTS, ...(value as Partial<ShortcutMap>) }
}

function readPersisted(): PersistedSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>
    return { ...DEFAULTS, ...parsed, shortcuts: normalizeShortcuts(parsed.shortcuts) }
  } catch {
    return DEFAULTS
  }
}

function persist(s: PersistedSettings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

/** Apply language + theme to <html> so CSS + RTL react immediately. */
export function applyToDocument(s: { theme: ThemeId; lang: Lang }) {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.dataset.theme = s.theme
  el.lang = s.lang
  el.dir = s.lang === 'ar' ? 'rtl' : 'ltr'
}

interface SettingsStore extends PersistedSettings {
  hydrated: boolean
  hydrate(): void
  setTheme(theme: ThemeId): void
  setLang(lang: Lang): void
  setDefaultType(type: CardType): void
  setShortcut(action: ShortcutAction, shortcut: ShortcutBinding): void
  resetShortcuts(): void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: () => {
    const persisted = readPersisted()
    applyToDocument(persisted)
    set({ ...persisted, hydrated: true })
    window.electronAPI?.setCaptureShortcut?.(persisted.shortcuts.capture).catch(() => undefined)
  },

  setTheme: (theme) => {
    set({ theme })
    const { lang, defaultType, shortcuts } = get()
    applyToDocument({ theme, lang })
    persist({ theme, lang, defaultType, shortcuts })
  },

  setLang: (lang) => {
    set({ lang })
    const { theme, defaultType, shortcuts } = get()
    applyToDocument({ theme, lang })
    persist({ theme, lang, defaultType, shortcuts })
  },

  setDefaultType: (defaultType) => {
    set({ defaultType })
    const { theme, lang, shortcuts } = get()
    persist({ theme, lang, defaultType, shortcuts })
  },

  setShortcut: (action, shortcut) => {
    const shortcuts = { ...get().shortcuts, [action]: shortcut }
    set({ shortcuts })
    const { theme, lang, defaultType } = get()
    persist({ theme, lang, defaultType, shortcuts })
    if (action === 'capture') {
      window.electronAPI?.setCaptureShortcut?.(shortcut).catch(() => undefined)
    }
  },

  resetShortcuts: () => {
    const shortcuts = DEFAULT_SHORTCUTS
    set({ shortcuts })
    const { theme, lang, defaultType } = get()
    persist({ theme, lang, defaultType, shortcuts })
    window.electronAPI?.setCaptureShortcut?.(shortcuts.capture).catch(() => undefined)
  },
}))
