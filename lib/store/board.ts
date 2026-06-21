'use client'

import { create } from 'zustand'
import type { BoardData, Card, CardStatus, NewCardInput } from '@/lib/types'

interface BoardStore {
  project: { path: string; name: string } | null
  board: BoardData | null
  selectedCard: Card | null
  isLoading: boolean
  error: string | null

  openProject(projectPath: string): Promise<void>
  refreshBoard(): Promise<void>
  selectCard(card: Card | null): void
  createCard(input: NewCardInput): Promise<Card>
  updateCard(id: string, data: Partial<NewCardInput>): Promise<void>
  moveCard(id: string, newStatus: CardStatus): Promise<void>
  deleteCard(id: string): Promise<void>
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  project: null,
  board: null,
  selectedCard: null,
  isLoading: false,
  error: null,

  openProject: async (projectPath) => {
    set({ isLoading: true, error: null })
    try {
      const board = await window.electronAPI.openProject(projectPath)
      set({ board, project: { path: projectPath, name: board.projectName }, isLoading: false })
    } catch (e) {
      set({ error: String(e), isLoading: false })
    }
  },

  refreshBoard: async () => {
    const { project } = get()
    if (!project) return
    try {
      const board = await window.electronAPI.openProject(project.path)
      set({ board })
    } catch { /* silent */ }
  },

  selectCard: (card) => set({ selectedCard: card }),

  createCard: async (input) => {
    const { project } = get()
    if (!project) throw new Error('No project open')
    const card = await window.electronAPI.createCard({ ...input, projectPath: project.path })
    set(state => {
      if (!state.board) return state
      const status = card.status
      return {
        board: {
          ...state.board,
          columns: {
            ...state.board.columns,
            [status]: [card, ...state.board.columns[status]],
          },
        },
      }
    })
    return card
  },

  updateCard: async (id, data) => {
    const { project, board } = get()
    if (!project || !board) return
    const updated = await window.electronAPI.updateCard(id, { ...data, projectPath: project.path })
    set(state => {
      if (!state.board) return state
      const oldCard = findCard(state.board, id)
      if (!oldCard) return state
      const oldStatus = oldCard.status
      const newStatus = updated.status
      let cols = { ...state.board.columns }

      // Remove from old column
      cols = { ...cols, [oldStatus]: cols[oldStatus].filter(c => c.id !== id) }
      // Insert into correct column
      if (oldStatus !== newStatus) {
        cols = { ...cols, [newStatus]: [updated, ...cols[newStatus]] }
      } else {
        cols = { ...cols, [newStatus]: cols[newStatus].map(c => c.id === id ? updated : c) }
      }

      return {
        board: { ...state.board, columns: cols },
        selectedCard: state.selectedCard?.id === id ? updated : state.selectedCard,
      }
    })
  },

  moveCard: async (id, newStatus) => {
    const { project, board } = get()
    if (!project || !board) return
    const card = findCard(board, id)
    if (!card || card.status === newStatus) return

    await window.electronAPI.moveCard(id, newStatus, project.path)

    set(state => {
      if (!state.board) return state
      const oldStatus = card.status
      const moved = { ...card, status: newStatus, updatedAt: new Date().toISOString() }
      const cols = {
        ...state.board.columns,
        [oldStatus]: state.board.columns[oldStatus].filter(c => c.id !== id),
        [newStatus]: [moved, ...state.board.columns[newStatus]],
      }
      return {
        board: { ...state.board, columns: cols },
        selectedCard: state.selectedCard?.id === id ? moved : state.selectedCard,
      }
    })
  },

  deleteCard: async (id) => {
    const { project, board } = get()
    if (!project || !board) return
    const card = findCard(board, id)
    if (!card) return

    await window.electronAPI.deleteCard(id, project.path)

    set(state => {
      if (!state.board) return state
      const status = card.status
      return {
        board: {
          ...state.board,
          columns: {
            ...state.board.columns,
            [status]: state.board.columns[status].filter(c => c.id !== id),
          },
        },
        selectedCard: state.selectedCard?.id === id ? null : state.selectedCard,
      }
    })
  },
}))

function findCard(board: BoardData, id: string): Card | undefined {
  for (const cards of Object.values(board.columns)) {
    const found = cards.find(c => c.id === id)
    if (found) return found
  }
  return undefined
}
