'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MarkdownEditor } from '@/components/card/MarkdownEditor'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'
import { AddIcon, DeleteIcon } from '@/components/ui/icons'
import type { PlanDoc } from '@/lib/types'

export function PlansView() {
  const project = useBoardStore(s => s.project)
  const t = useT()
  const [plans, setPlans] = useState<PlanDoc[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (keepSelection = true) => {
    if (!project || !window.electronAPI) return
    const list = await window.electronAPI.listPlans(project.path)
    setPlans(list)
    setSelectedId(prev => {
      const next = keepSelection && prev && list.some(p => p.id === prev) ? prev : list[0]?.id ?? null
      const doc = list.find(p => p.id === next)
      setBody(doc?.body ?? '')
      return next
    })
  }, [project])

  useEffect(() => { load(false) }, [load])

  const select = (id: string) => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    setSelectedId(id)
    setBody(plans.find(p => p.id === id)?.body ?? '')
  }

  const onBodyChange = (next: string) => {
    setBody(next)
    if (!project || !selectedId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const updated = await window.electronAPI.updatePlan(project.path, selectedId, { body: next })
      if (updated) {
        setPlans(prev => prev
          .map(p => (p.id === updated.id ? updated : p))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
      }
    }, 500)
  }

  const newPlan = async () => {
    if (!project) return
    const created = await window.electronAPI.createPlan(project.path, t('plans.untitled'))
    setPlans(prev => [created, ...prev])
    setSelectedId(created.id)
    setBody(created.body)
  }

  const removePlan = async (id: string) => {
    if (!project) return
    await window.electronAPI.deletePlan(project.path, id)
    setPlans(prev => {
      const next = prev.filter(p => p.id !== id)
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null)
        setBody(next[0]?.body ?? '')
      }
      return next
    })
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Plan list */}
      <div className="w-64 shrink-0 border-e border-border-subtle flex flex-col">
        <div className="flex items-center justify-between px-3 py-3 border-b border-border-subtle">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t('plans.title')}</span>
          <button
            onClick={newPlan}
            className="p-1 rounded text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors"
            title={t('plans.new')}
          >
            <AddIcon size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {plans.length === 0 && (
            <p className="px-2 py-4 text-xs text-text-muted text-center">{t('plans.empty')}</p>
          )}
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              className={`group/plan w-full flex items-center gap-2 px-2 py-1.5 rounded text-start text-sm transition-all ${
                selectedId === p.id
                  ? 'bg-accent-soft text-text-primary font-medium'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              <span className="text-[10px] font-mono text-text-muted shrink-0">{p.id}</span>
              <span className="truncate flex-1">{p.title}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); removePlan(p.id) }}
                className="opacity-0 group-hover/plan:opacity-100 p-0.5 rounded text-text-muted hover:text-danger transition-all shrink-0"
                title={t('plans.delete')}
              >
                <DeleteIcon size={13} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {selectedId ? (
          <div className="max-w-3xl mx-auto px-10 py-8">
            <MarkdownEditor key={selectedId} value={body} onChange={onBodyChange} placeholder={t('plans.placeholder')} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-text-muted">
            <p className="text-sm">{t('plans.empty')}</p>
            <button
              onClick={newPlan}
              className="flex items-center gap-2 rounded border border-border-strong px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <AddIcon size={14} /> {t('plans.new')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
