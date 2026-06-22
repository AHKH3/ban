import { ipcMain } from 'electron'
import { readPlans, createPlan, updatePlan, deletePlan } from '../fs/plans'

export function setupPlansIPC(): void {
  ipcMain.handle('plans:list', async (_event, projectPath: string) => {
    return readPlans(projectPath)
  })

  ipcMain.handle('plans:create', async (_event, projectPath: string, title: string) => {
    return createPlan(projectPath, title)
  })

  ipcMain.handle('plans:update', async (_event, projectPath: string, id: string, updates: { title?: string; body?: string }) => {
    return updatePlan(projectPath, id, updates)
  })

  ipcMain.handle('plans:delete', async (_event, projectPath: string, id: string) => {
    deletePlan(projectPath, id)
  })
}
