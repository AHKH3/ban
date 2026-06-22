import { ipcMain, type BrowserWindow } from 'electron'
import type { RunStartInput } from '../../lib/types'
import {
  detectAgents, startRun, stopRun, listRunMetas, readRunLines,
} from '../agents/runner'

export function setupOrchestrationIPC(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('agents:detect', async () => {
    return detectAgents()
  })

  ipcMain.handle('run:start', async (_event, input: RunStartInput) => {
    return startRun(input, getMainWindow())
  })

  ipcMain.handle('run:stop', async (_event, runId: string) => {
    stopRun(runId)
  })

  ipcMain.handle('run:list', async (_event, projectPath: string) => {
    return listRunMetas(projectPath)
  })

  ipcMain.handle('run:get-lines', async (_event, projectPath: string, runId: string) => {
    return readRunLines(projectPath, runId)
  })
}
