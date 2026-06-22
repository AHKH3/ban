import { ipcMain } from 'electron'
import { listDir, readTextFile, writeTextFile } from '../fs/tree'

export function setupFilesIPC(): void {
  ipcMain.handle('files:list', async (_event, projectPath: string, relPath: string) => {
    return listDir(projectPath, relPath ?? '')
  })

  ipcMain.handle('files:read', async (_event, projectPath: string, relPath: string) => {
    return readTextFile(projectPath, relPath)
  })

  ipcMain.handle('files:write', async (_event, projectPath: string, relPath: string, content: string) => {
    writeTextFile(projectPath, relPath, content)
  })
}
