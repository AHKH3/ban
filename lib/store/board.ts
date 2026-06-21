'use client'

import { create } from 'zustand'
import { ALL_STATUSES, type BoardData, type Card, type CardStatus, type NewCardInput } from '@/lib/types'

interface BoardStore {
  project: { path: string; name: string } | null
  board: BoardData | null
  selectedCard: Card | null
  selectedCardIds: Set<string>
  isLoading: boolean
  error: string | null

  openProject(projectPath: string): Promise<void>
  refreshBoard(): Promise<void>
  selectCard(card: Card | null): void
  clearSelectedCards(): void
  toggleCardSelection(id: string): void
  createCard(input: NewCardInput): Promise<Card>
  updateCard(id: string, data: Partial<NewCardInput>): Promise<void>
  moveCard(id: string, newStatus: CardStatus): Promise<void>
  moveCards(ids: string[], newStatus: CardStatus): Promise<void>
  deleteCard(id: string): Promise<void>
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  project: null,
  board: null,
  selectedCard: null,
  selectedCardIds: new Set(),
  isLoading: false,
  error: null,

  openProject: async (projectPath) => {
    set({ isLoading: true, error: null })
    try {
      const board = await window.electronAPI.openProject(projectPath)
      set({ board, project: { path: projectPath, name: board.projectName }, selectedCardIds: new Set(), isLoading: false })
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

  clearSelectedCards: () => set({ selectedCardIds: new Set() }),

  toggleCardSelection: (id) => set(state => {
    const selectedCardIds = new Set(state.selectedCardIds)
    if (selectedCardIds.has(id)) {
      selectedCardIds.delete(id)
    } else {
      selectedCardIds.add(id)
    }
    return { selectedCardIds }
  }),

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

  moveCards: async (ids, newStatus) => {
    const { project, board } = get()
    if (!project || !board) return

    const cardsToMove = cardsForIds(board, ids).filter(card => card.status !== newStatus)
    if (cardsToMove.length === 0) return

    for (const card of cardsToMove) {
      await window.electronAPI.moveCard(card.id, newStatus, project.path)
    }

    const movedAt = new Date().toISOString()
    set(state => {
      if (!state.board) return state

      const movedCards = movedCardCopies(cardsToMove, newStatus, movedAt)
      return {
        board: { ...state.board, columns: columnsAfterMove(state.board, cardsToMove, movedCards, newStatus) },
        selectedCard: selectedCardAfterMove(state.selectedCard, movedCards),
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

function cardsForIds(board: BoardData, ids: string[]): Card[] {
  return Array.from(new Set(ids))
    .map(id => findCard(board, id))
    .filter((card): card is Card => Boolean(card))
}

function movedCardCopies(cards: Card[], newStatus: CardStatus, movedAt: string): Card[] {
  return cards.map(card => ({ ...card, status: newStatus, updatedAt: movedAt }))
}

function columnsAfterMove(
  board: BoardData,
  cardsToMove: Card[],
  movedCards: Card[],
  newStatus: CardStatus,
) {
  const movingIds = new Set(cardsToMove.map(card => card.id))
  const columns = { ...board.columns }

  for (const status of ALL_STATUSES) {
    columns[status] = columns[status].filter(card => !movingIds.has(card.id))
  }

  columns[newStatus] = [...movedCards, ...columns[newStatus]]
  return columns
}

function selectedCardAfterMove(selectedCard: Card | null, movedCards: Card[]): Card | null {
  if (!selectedCard) return null
  return movedCards.find(card => card.id === selectedCard.id) ?? selectedCard
}
