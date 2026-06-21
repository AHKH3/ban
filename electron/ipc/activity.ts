import { ipcMain } from 'electron'
import type { ActivityRange } from '../../lib/types'
import { readActivityEvents } from '../fs/activity'

export function setupActivityIPC(): void {
  ipcMain.handle('activity:list', async (_event, projectPath: string, range: ActivityRange = {}) => {
    return readActivityEvents(projectPath, range)
  })
}
