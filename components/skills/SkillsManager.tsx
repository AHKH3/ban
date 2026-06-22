'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MarkdownEditor } from '@/components/card/MarkdownEditor'
import { useBoardStore } from '@/lib/store/board'
import { useT } from '@/lib/i18n'
import { AddIcon, DeleteIcon } from '@/components/ui/icons'
import type { SkillDoc } from '@/lib/types'

export function SkillsManager() {
  const project = useBoardStore(s => s.project)
  const t = useT()
  const [skills, setSkills] = useState<SkillDoc[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ name: string; description: string; body: string }>({ name: '', description: '', body: '' })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectInto = useCallback((s: SkillDoc | undefined) => {
    if (!s) { setSelectedId(null); return }
    setSelectedId(s.id)
    setDraft({ name: s.name, description: s.description, body: s.body })
  }, [])

  const load = useCallback(async () => {
    if (!project || !window.electronAPI) return
    const list = await window.electronAPI.listSkills(project.path)
    setSkills(list)
    setSelectedId(prev => {
      const keep = prev && list.some(s => s.id === prev) ? prev : list[0]?.id ?? null
      selectInto(list.find(s => s.id === keep))
      return keep
    })
  }, [project, selectInto])

  useEffect(() => { load() }, [load])

  const scheduleSave = (next: { name: string; description: string; body: string }) => {
    setDraft(next)
    if (!project || !selectedId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const updated = await window.electronAPI.updateSkill(project.path, selectedId, next)
      if (updated) setSkills(prev => prev.map(s => (s.id === updated.id ? updated : s)))
    }, 500)
  }

  const newSkill = async () => {
    if (!project) return
    const created = await window.electronAPI.createSkill(project.path, t('skills.untitled'))
    setSkills(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    selectInto(created)
  }

  const removeSkill = async (id: string) => {
    if (!project) return
    await window.electronAPI.deleteSkill(project.path, id)
    setSkills(prev => {
      const next = prev.filter(s => s.id !== id)
      if (selectedId === id) selectInto(next[0])
      return next
    })
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Skill list */}
      <div className="w-64 shrink-0 border-e border-border-subtle flex flex-col">
        <div className="flex items-center justify-between px-3 py-3 border-b border-border-subtle">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{t('skills.title')}</span>
          <button onClick={newSkill} className="p-1 rounded text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors" title={t('skills.new')}>
            <AddIcon size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {skills.length === 0 && <p className="px-2 py-4 text-xs text-text-muted text-center">{t('skills.empty')}</p>}
          {skills.map(s => (
            <button
              key={s.id}
              onClick={() => selectInto(s)}
              className={`group/skill w-full flex items-center gap-2 px-2 py-1.5 rounded text-start text-sm transition-all ${
                selectedId === s.id ? 'bg-accent-soft text-text-primary font-medium' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              <span className="truncate flex-1">{s.name}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); removeSkill(s.id) }}
                className="opacity-0 group-hover/skill:opacity-100 p-0.5 rounded text-text-muted hover:text-danger transition-all shrink-0"
                title={t('skills.delete')}
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
            <input
              value={draft.name}
              onChange={e => scheduleSave({ ...draft, name: e.target.value })}
              placeholder={t('skills.namePlaceholder')}
              className="w-full bg-transparent text-lg font-semibold text-text-primary placeholder:text-text-muted focus:outline-none mb-2"
            />
            <input
              value={draft.description}
              onChange={e => scheduleSave({ ...draft, description: e.target.value })}
              placeholder={t('skills.descPlaceholder')}
              className="w-full bg-transparent text-sm text-text-secondary placeholder:text-text-muted focus:outline-none mb-4 pb-4 border-b border-border-subtle"
            />
            <MarkdownEditor key={selectedId} value={draft.body} onChange={body => scheduleSave({ ...draft, body })} placeholder={t('skills.bodyPlaceholder')} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-text-muted">
            <p className="text-sm max-w-xs text-center">{t('skills.intro')}</p>
            <button onClick={newSkill} className="flex items-center gap-2 rounded border border-border-strong px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">
              <AddIcon size={14} /> {t('skills.new')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
