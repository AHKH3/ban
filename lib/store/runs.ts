'use client'

import { create } from 'zustand'
import type { AvailableAgent, RunLine, RunMeta } from '@/lib/types'

const MAX_LINES = 2000

interface RunRecord {
  meta: RunMeta
  lines: RunLine[]
}

interface RunsStore {
  available: AvailableAgent[] | null
  runs: Record<string, RunRecord>      // by runId
  activeByCard: Record<string, string> // cardId -> latest runId
  openRunId: string | null
  subscribed: boolean

  ensureSubscribed(): void
  detect(): Promise<AvailableAgent[]>
  start(projectPath: string, cardId: string, agentId: string): Promise<RunMeta>
  stop(runId: string): Promise<void>
  openRun(runId: string | null): void
  loadLines(projectPath: string, runId: string): Promise<void>

  runForCard(cardId: string): RunRecord | undefined
}

export const useRunsStore = create<RunsStore>((set, get) => ({
  available: null,
  runs: {},
  activeByCard: {},
  openRunId: null,
  subscribed: false,

  ensureSubscribed: () => {
    if (get().subscribed || typeof window === 'undefined') return
    set({ subscribed: true })
    window.electronAPI.onRunEvent(msg => {
      set(state => {
        const existing = state.runs[msg.runId]
        if (msg.kind === 'line') {
          const lines = [...(existing?.lines ?? []), msg.line].slice(-MAX_LINES)
          const meta = existing?.meta
          if (!meta) return { runs: { ...state.runs, [msg.runId]: { meta: placeholderMeta(msg.runId), lines } } }
          return { runs: { ...state.runs, [msg.runId]: { meta, lines } } }
        }
        // status update
        const lines = existing?.lines ?? []
        return { runs: { ...state.runs, [msg.runId]: { meta: msg.meta, lines } } }
      })
    })
  },

  detect: async () => {
    const available = await window.electronAPI.detectAgents()
    set({ available })
    return available
  },

  start: async (projectPath, cardId, agentId) => {
    const meta = await window.electronAPI.startRun({ projectPath, cardId, agentId })
    set(state => ({
      runs: { ...state.runs, [meta.id]: { meta, lines: state.runs[meta.id]?.lines ?? [] } },
      activeByCard: { ...state.activeByCard, [cardId]: meta.id },
      openRunId: meta.id,
    }))
    return meta
  },

  stop: async (runId) => {
    await window.electronAPI.stopRun(runId)
  },

  openRun: (runId) => set({ openRunId: runId }),

  loadLines: async (projectPath, runId) => {
    const lines = await window.electronAPI.getRunLines(projectPath, runId)
    set(state => {
      const existing = state.runs[runId]
      if (!existing) return state
      return { runs: { ...state.runs, [runId]: { ...existing, lines } } }
    })
  },

  runForCard: (cardId) => {
    const runId = get().activeByCard[cardId]
    return runId ? get().runs[runId] : undefined
  },
}))

function placeholderMeta(runId: string): RunMeta {
  return {
    id: runId, agentId: '', agentName: '', cardId: '', cardTitle: '',
    status: 'running', startedAt: new Date().toISOString(),
  }
}
