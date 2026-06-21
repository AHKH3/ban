import { ipcMain } from 'electron'
import type { NewCardInput } from '../../lib/types'
import { readBoard } from '../fs/project'
import { createCard, updateCardFile, moveCardFile, deleteCardFile, readCardFile } from '../fs/cards'
import { indexCard, removeFromIndex } from '../db'
import { suppressPath } from '../watcher'
import { appendActivityEvent, cardSnapshot } from '../fs/activity'

function changedFields(before: ReturnType<typeof cardSnapshot>, after: ReturnType<typeof cardSnapshot>): string[] {
  const fields: Array<keyof ReturnType<typeof cardSnapshot>> = ['title', 'status', 'type', 'priority', 'tags']
  return fields.filter(field => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
}

export function setupCardsIPC(): void {
  ipcMain.handle('card:create', async (_event, data: NewCardInput & { projectPath: string }) => {
    const { projectPath, ...input } = data
    const card = createCard(projectPath, input, suppressPath)
    const snapshot = cardSnapshot(card)
    appendActivityEvent(projectPath, {
      kind: 'card.created',
      cardId: card.id,
      cardTitle: card.title,
      after: snapshot,
    })
    indexCard(card, projectPath)
    return card
  })

  ipcMain.handle('card:update', async (_event, id: string, updates: Partial<NewCardInput> & { projectPath: string }) => {
    const { projectPath, ...rest } = updates
    const board = readBoard(projectPath)
    const allCards = Object.values(board.columns).flat()
    const existing = allCards.find(c => c.id === id)
    if (!existing) throw new Error(`Card ${id} not found`)

    const updated = updateCardFile(existing, rest, projectPath, suppressPath)
    const before = cardSnapshot(existing)
    const after = cardSnapshot(updated)
    appendActivityEvent(projectPath, {
      kind: existing.status === updated.status ? 'card.updated' : 'card.moved',
      cardId: updated.id,
      cardTitle: updated.title,
      before,
      after,
      changedFields: changedFields(before, after),
    })
    indexCard(updated, projectPath)
    return updated
  })

  ipcMain.handle('card:move', async (_event, id: string, newStatus: string, projectPath: string) => {
    const board = readBoard(projectPath)
    const allCards = Object.values(board.columns).flat()
    const card = allCards.find(c => c.id === id)
    if (!card) throw new Error(`Card ${id} not found`)

    const moved = moveCardFile(card, newStatus as never, projectPath, suppressPath)
    const before = cardSnapshot(card)
    const after = cardSnapshot(moved)
    appendActivityEvent(projectPath, {
      kind: 'card.moved',
      cardId: moved.id,
      cardTitle: moved.title,
      before,
      after,
      changedFields: ['status'],
    })
    indexCard(moved, projectPath)
  })

  ipcMain.handle('card:delete', async (_event, id: string, projectPath: string) => {
    const board = readBoard(projectPath)
    const allCards = Object.values(board.columns).flat()
    const card = allCards.find(c => c.id === id)
    if (!card) return

    const before = cardSnapshot(card)
    deleteCardFile(card, suppressPath)
    appendActivityEvent(projectPath, {
      kind: 'card.deleted',
      cardId: card.id,
      cardTitle: card.title,
      before,
      changedFields: ['status'],
    })
    removeFromIndex(id)
  })
}
