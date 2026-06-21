import { ipcMain } from 'electron'
import { searchCards } from '../db'

export function setupSearchIPC(): void {
  ipcMain.handle('search:query', async (_event, query: string, projectPath: string) => {
    return searchCards(query, projectPath)
  })
}
