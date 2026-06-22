import { ipcMain } from 'electron'
import { readSkills, createSkill, updateSkill, deleteSkill } from '../fs/skills'
import { reprojectAgents } from '../fs/agents'

export function setupSkillsIPC(): void {
  ipcMain.handle('skills:list', async (_event, projectPath: string) => {
    return readSkills(projectPath)
  })

  ipcMain.handle('skills:create', async (_event, projectPath: string, name: string) => {
    const skill = createSkill(projectPath, name)
    reprojectAgents(projectPath) // refresh the skills index inside agent configs
    return skill
  })

  ipcMain.handle('skills:update', async (_event, projectPath: string, id: string, updates: { name?: string; description?: string; body?: string }) => {
    const skill = updateSkill(projectPath, id, updates)
    reprojectAgents(projectPath)
    return skill
  })

  ipcMain.handle('skills:delete', async (_event, projectPath: string, id: string) => {
    deleteSkill(projectPath, id)
    reprojectAgents(projectPath)
  })
}
