import { ipcMain } from 'electron'
import {
  getAgentsState,
  setSelectedAgents,
  writeRules,
  reprojectAgents,
} from '../fs/agents'

export function setupAgentsIPC(): void {
  ipcMain.handle('agents:get', async (_event, projectPath: string) => {
    return getAgentsState(projectPath)
  })

  ipcMain.handle('agents:set-selected', async (_event, projectPath: string, selected: string[]) => {
    return setSelectedAgents(projectPath, selected)
  })

  ipcMain.handle('agents:save-rules', async (_event, projectPath: string, content: string) => {
    writeRules(projectPath, content)
    return reprojectAgents(projectPath)
  })
}
