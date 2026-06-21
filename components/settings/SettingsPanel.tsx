'use client'

import { useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { StatusIcon } from '@/components/card/StatusIcon'
import { useSettingsStore, THEMES } from '@/lib/store/settings'
import type { ThemeId } from '@/lib/store/settings'
import { useT, LANGUAGES } from '@/lib/i18n'
import { CARD_TYPE_LABELS } from '@/lib/types'
import type { CardType } from '@/lib/types'
import { formatShortcut, shortcutFromEvent } from '@/lib/shortcuts'
import type { ShortcutAction } from '@/lib/shortcuts'

const TYPE_KEY: Record<CardType, string> = {
  task: 'type.task', idea: 'type.idea', bug: 'type.bug', problem: 'type.problem',
  decision: 'type.decision', question: 'type.question', note: 'type.note',
}

const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  capture: 'shortcut.capture',
  palette: 'shortcut.palette',
  newCard: 'shortcut.newCard',
  save: 'shortcut.save',
}

// Tiny preview swatch for each theme using its real CSS vars.
function ThemeSwatch({ id }: { id: ThemeId }) {
  return (
    <div
      data-theme={id}
      className="flex h-12 w-full items-center gap-1.5 rounded-md border px-2"
      style={{ background: 'var(--bg)', borderColor: 'var(--border-strong)' }}
    >
      <span className="h-6 w-6 rounded" style={{ background: 'var(--surface-2)', boxShadow: '0 0 0 1px var(--border-subtle)' }} />
      <div className="flex flex-1 flex-col gap-1">
        <span className="h-1.5 w-3/4 rounded-full" style={{ background: 'var(--text-secondary)' }} />
        <span className="h-1.5 w-1/2 rounded-full" style={{ background: 'var(--text-muted)' }} />
      </div>
      <span className="h-4 w-4 rounded-full" style={{ background: 'var(--accent)' }} />
    </div>
  )
}

export function SettingsPanel() {
  const t = useT()
  const { theme, lang, defaultType, shortcuts, setTheme, setLang, setDefaultType, setShortcut, resetShortcuts } = useSettingsStore()
  const sections = ['settings.appearance', 'settings.language', 'settings.general', 'settings.shortcuts', 'settings.about']
  const [active, setActive] = useState(0)
  const [recording, setRecording] = useState<ShortcutAction | null>(null)

  const shortcutActions: ShortcutAction[] = ['capture', 'palette', 'newCard', 'save']

  const handleShortcutKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, action: ShortcutAction) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.code === 'Escape') {
      setRecording(null)
      return
    }

    const next = shortcutFromEvent(event.nativeEvent)
    if (!next) return
    setShortcut(action, next)
    setRecording(null)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Section nav */}
      <nav className="w-48 shrink-0 border-e border-border-subtle p-3 space-y-0.5">
        {sections.map((s, i) => (
          <button
            key={s}
            onClick={() => setActive(i)}
            className={`w-full text-start px-3 py-2 rounded text-sm transition-colors ${
              i === active ? 'bg-surface-2 text-text-primary' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
            }`}
          >
            {t(s)}
          </button>
        ))}
      </nav>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Appearance / theme */}
        {active === 0 && (
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-1">{t('settings.appearance')}</h2>
            <p className="text-xs text-text-muted mb-4">{t('settings.theme')}</p>
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {THEMES.map(th => (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={`flex flex-col gap-2 rounded-lg border p-2 text-start transition-all ${
                    theme === th.id ? 'border-accent ring-1 ring-accent-border' : 'border-border-subtle hover:border-border-strong'
                  }`}
                >
                  <ThemeSwatch id={th.id} />
                  <span className="flex items-center justify-between px-0.5">
                    <span className="text-sm text-text-primary">{t(th.labelKey)}</span>
                    {theme === th.id && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Language */}
        {active === 1 && (
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-1">{t('settings.language')}</h2>
            <p className="text-xs text-text-muted mb-4">{t('settings.uiLanguage')}</p>
            <div className="flex gap-3 max-w-md">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className={`flex-1 rounded-lg border px-4 py-3 text-center transition-all ${
                    lang === l.id ? 'border-accent ring-1 ring-accent-border bg-accent-soft' : 'border-border-subtle hover:border-border-strong'
                  }`}
                >
                  <div className="text-base text-text-primary" style={{ fontFamily: l.id === 'ar' ? 'var(--font-ar-stack)' : 'var(--font-en-stack)' }}>
                    {l.native}
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">{l.label}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* General */}
        {active === 2 && (
          <section className="max-w-md">
            <h2 className="text-base font-semibold text-text-primary mb-4">{t('settings.general')}</h2>
            <label className="block text-sm text-text-secondary mb-1.5">{t('settings.defaultType')}</label>
            <select
              value={defaultType}
              onChange={e => setDefaultType(e.target.value as CardType)}
              className="w-full bg-surface-2 border border-border-subtle rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-border"
            >
              {(Object.keys(CARD_TYPE_LABELS) as CardType[]).map(ct => (
                <option key={ct} value={ct}>{t(TYPE_KEY[ct])}</option>
              ))}
            </select>
          </section>
        )}

        {/* Shortcuts */}
        {active === 3 && (
          <section className="max-w-md">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-text-primary">{t('settings.shortcuts')}</h2>
                <p className="mt-1 text-xs text-text-muted">{t('settings.shortcutsHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => { resetShortcuts(); setRecording(null) }}
                className="shrink-0 rounded border border-border-subtle px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
              >
                {t('settings.resetShortcuts')}
              </button>
            </div>
            <div className="space-y-0">
              {shortcutActions.map(action => (
                <div key={action} className="flex items-center justify-between gap-3 py-2.5 border-b border-border-subtle">
                  <span className="text-sm text-text-secondary">{t(SHORTCUT_LABELS[action])}</span>
                  <button
                    type="button"
                    onClick={() => setRecording(action)}
                    onKeyDown={event => recording === action && handleShortcutKeyDown(event, action)}
                    className={`min-w-32 rounded border px-2 py-1 text-center text-xs font-mono transition-colors ${
                      recording === action
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-border-strong bg-surface-3 text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {recording === action ? t('settings.pressShortcut') : formatShortcut(shortcuts[action])}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {active === 4 && (
          <section className="max-w-md">
            <h2 className="text-base font-semibold text-text-primary mb-3">{t('settings.about')}</h2>
            <div className="flex items-center gap-2 text-text-muted">
              <StatusIcon status="done" size={16} />
              <p className="text-sm">{t('settings.aboutText')}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
