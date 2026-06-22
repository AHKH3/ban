import { ipcMain, dialog, BrowserWindow } from 'electron'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Store = require('electron-store')
import type { Project } from '../../lib/types'
import { selectDefaultProjectPath } from '../../lib/capture-project'
import { readBoard, initProject, isKanbanProject } from '../fs/project'
import { indexProject } from '../db'
import { watchProject } from '../watcher'

const store = new Store({ name: 'ban-prefs' })

export function setupProjectIPC(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('project:open-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Open Project Folder',
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle('project:open', async (_event, projectPath: string) => {
    if (!isKanbanProject(projectPath)) {
      initProject(projectPath)
    }
    const board = readBoard(projectPath)

    // Update recent projects
    const recent: Project[] = store.get('recentProjects', []) as Project[]
    const filtered = recent.filter(p => p.path !== projectPath)
    const updated: Project[] = [
      { path: projectPath, name: board.projectName, lastOpenedAt: new Date().toISOString() },
      ...filtered,
    ].slice(0, 10)
    store.set('recentProjects', updated)
    store.set('lastProject', projectPath)

    // Index all cards for search
    const allCards = Object.values(board.columns).flat()
    indexProject(allCards, projectPath)

    // Watch for external changes
    const mainWindow = getMainWindow()
    if (mainWindow) watchProject(projectPath, mainWindow)

    return board
  })

  ipcMain.handle('project:init', async (_event, projectPath: string) => {
    initProject(projectPath)
  })

  ipcMain.handle('project:get-recent', async () => {
    return store.get('recentProjects', []) as Project[]
  })

  ipcMain.handle('project:get-last', async () => {
    const recent = store.get('recentProjects', []) as Project[]
    return selectDefaultProjectPath(store.get('lastProject', null) as string | null, recent)
  })
}
