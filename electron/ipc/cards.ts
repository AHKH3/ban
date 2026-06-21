import { ipcMain } from 'electron'
import type { NewCardInput } from '../../lib/types'
import { readBoard } from '../fs/project'
import { createCard, updateCardFile, moveCardFile, deleteCardFile, readCardFile } from '../fs/cards'
import { indexCard, removeFromIndex } from '../db'
import { suppressPath } from '../watcher'

export function setupCardsIPC(): void {
  ipcMain.handle('card:create', async (_event, data: NewCardInput & { projectPath: string }) => {
    const { projectPath, ...input } = data
    const card = createCard(projectPath, input, suppressPath)
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
    indexCard(updated, projectPath)
    return updated
  })

  ipcMain.handle('card:move', async (_event, id: string, newStatus: string, projectPath: string) => {
    const board = readBoard(projectPath)
    const allCards = Object.values(board.columns).flat()
    const card = allCards.find(c => c.id === id)
    if (!card) throw new Error(`Card ${id} not found`)

    const moved = moveCardFile(card, newStatus as never, projectPath, suppressPath)
    indexCard(moved, projectPath)
  })

  ipcMain.handle('card:delete', async (_event, id: string, projectPath: string) => {
    const board = readBoard(projectPath)
    const allCards = Object.values(board.columns).flat()
    const card = allCards.find(c => c.id === id)
    if (!card) return

    deleteCardFile(card, suppressPath)
    removeFromIndex(id)
  })
}
