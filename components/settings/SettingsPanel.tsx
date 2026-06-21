'use client'

import { useState } from 'react'
import { StatusIcon } from '@/components/card/StatusIcon'
import { useSettingsStore, THEMES } from '@/lib/store/settings'
import type { ThemeId } from '@/lib/store/settings'
import { useT, LANGUAGES } from '@/lib/i18n'
import { CARD_TYPE_LABELS } from '@/lib/types'
import type { CardType } from '@/lib/types'

const TYPE_KEY: Record<CardType, string> = {
  task: 'type.task', idea: 'type.idea', bug: 'type.bug', problem: 'type.problem',
  decision: 'type.decision', question: 'type.question', note: 'type.note',
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
  const { theme, lang, defaultType, setTheme, setLang, setDefaultType } = useSettingsStore()
  const sections = ['settings.appearance', 'settings.language', 'settings.general', 'settings.shortcuts', 'settings.about']
  const [active, setActive] = useState(0)

  const shortcuts: [string, string][] = [
    ['shortcut.capture', 'Ctrl + Shift + Space'],
    ['shortcut.palette', 'Ctrl + K'],
    ['shortcut.newCard', 'N'],
    ['shortcut.save', 'Ctrl + S'],
  ]

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
            <h2 className="text-base font-semibold text-text-primary mb-4">{t('settings.shortcuts')}</h2>
            <div className="space-y-0">
              {shortcuts.map(([action, sc]) => (
                <div key={action} className="flex items-center justify-between py-2.5 border-b border-border-subtle">
                  <span className="text-sm text-text-secondary">{t(action)}</span>
                  <kbd className="text-xs bg-surface-3 border border-border-strong rounded px-2 py-0.5 text-text-muted font-mono">{sc}</kbd>
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
