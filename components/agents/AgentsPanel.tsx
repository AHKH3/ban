'use client'

import { useEffect, useState, useCallback } from 'react'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'
import type { AgentsState } from '@/lib/types'

export function AgentsPanel() {
  const project = useBoardStore(s => s.project)
  const t = useT()
  const [state, setState] = useState<AgentsState | null>(null)
  const [rules, setRules] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!project || !window.electronAPI) return
    const s = await window.electronAPI.getAgents(project.path)
    setState(s)
    setRules(s.rulesContent)
    setDirty(false)
  }, [project])

  useEffect(() => { load() }, [load])

  const toggleAgent = async (id: string) => {
    if (!project || !state || busy) return
    setBusy(true)
    const next = state.selected.includes(id)
      ? state.selected.filter(x => x !== id)
      : [...state.selected, id]
    const updated = await window.electronAPI.setSelectedAgents(project.path, next)
    setState(updated)
    setRules(updated.rulesContent)
    setBusy(false)
  }

  const saveRules = async () => {
    if (!project || saving) return
    setSaving(true)
    const updated = await window.electronAPI.saveAgentRules(project.path, rules)
    setState(updated)
    setDirty(false)
    setSaving(false)
  }

  if (!state) {
    return <div className="h-full flex items-center justify-center text-text-muted text-sm">{t('agents.loading')}</div>
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8">
        <h1 className="text-lg font-semibold text-text-primary">{t('agents.title')}</h1>
        <p className="mt-1 text-sm text-text-muted">{t('agents.subtitle')}</p>

        {/* Agent selection */}
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">{t('agents.yourAgents')}</h2>
          <div className="space-y-2">
            {state.agents.map(agent => {
              const on = state.selected.includes(agent.id)
              return (
                <button
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  disabled={busy}
                  className={`w-full flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-start transition-all disabled:opacity-60 ${
                    on ? 'border-accent ring-1 ring-accent-border bg-accent-soft' : 'border-border-subtle hover:border-border-strong'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm text-text-primary font-medium">{agent.name}</div>
                    <div className="text-[11px] text-text-muted font-mono mt-0.5">
                      {agent.configPath} · {agent.supportsImport ? t('agents.viaImport') : t('agents.viaInline')}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 h-5 w-5 rounded-full border flex items-center justify-center text-[10px] ${
                      on ? 'border-accent bg-accent text-bg' : 'border-border-strong text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Canonical rules editor */}
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              {t('agents.rulesTitle')} <span className="font-mono normal-case text-text-muted">· {state.rulesPath}</span>
            </h2>
            <button
              onClick={saveRules}
              disabled={!dirty || saving}
              className="shrink-0 rounded border border-border-strong bg-surface-3 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              {saving ? t('agents.saving') : t('agents.saveRules')}
            </button>
          </div>
          <p className="text-xs text-text-muted mb-3">{t('agents.rulesHint')}</p>
          <textarea
            value={rules}
            onChange={e => { setRules(e.target.value); setDirty(true) }}
            spellCheck={false}
            placeholder={t('agents.rulesPlaceholder')}
            className="w-full h-72 resize-y bg-surface-2 border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary font-mono leading-relaxed focus:outline-none focus:border-accent-border"
            dir="ltr"
          />
          {state.selected.length === 0 && (
            <p className="mt-3 text-xs text-text-muted">{t('agents.noneSelected')}</p>
          )}
        </section>
      </div>
    </div>
  )
}
