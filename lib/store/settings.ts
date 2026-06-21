'use client'

import { create } from 'zustand'
import type { CardType } from '@/lib/types'

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
}

const STORAGE_KEY = 'ban-settings'
const DEFAULTS: PersistedSettings = {
  theme: 'dark-soft',
  lang: 'en',
  defaultType: 'task',
}

function readPersisted(): PersistedSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<PersistedSettings>) }
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
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: () => {
    const persisted = readPersisted()
    applyToDocument(persisted)
    set({ ...persisted, hydrated: true })
  },

  setTheme: (theme) => {
    set({ theme })
    const { lang, defaultType } = get()
    applyToDocument({ theme, lang })
    persist({ theme, lang, defaultType })
  },

  setLang: (lang) => {
    set({ lang })
    const { theme, defaultType } = get()
    applyToDocument({ theme, lang })
    persist({ theme, lang, defaultType })
  },

  setDefaultType: (defaultType) => {
    set({ defaultType })
    const { theme, lang } = get()
    persist({ theme, lang, defaultType })
  },
}))
