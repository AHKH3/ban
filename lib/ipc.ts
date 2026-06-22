import type { BoardData, Card, Project, SearchResult, NewCardInput, ActivityEvent, ActivityRange, AgentsState, PlanDoc, FileEntry, FileContent, SkillDoc } from './types'
import type { ShortcutBinding } from './shortcuts'

export interface ElectronAPI {
  // Project
  openProjectDialog(): Promise<string | null>
  openProject(projectPath: string): Promise<BoardData>
  initProject(projectPath: string): Promise<void>
  getRecentProjects(): Promise<Project[]>

  // Cards
  createCard(data: NewCardInput & { projectPath: string }): Promise<Card>
  updateCard(id: string, data: Partial<NewCardInput> & { projectPath: string }): Promise<Card>
  moveCard(id: string, newStatus: string, projectPath: string): Promise<void>
  deleteCard(id: string, projectPath: string): Promise<void>

  // Search
  searchCards(query: string, projectPath: string): Promise<SearchResult[]>

  // Activity
  getActivityEvents(projectPath: string, range: ActivityRange): Promise<ActivityEvent[]>

  // Agents (rules projection)
  getAgents(projectPath: string): Promise<AgentsState>
  setSelectedAgents(projectPath: string, selected: string[]): Promise<AgentsState>
  saveAgentRules(projectPath: string, content: string): Promise<AgentsState>

  // Plans
  listPlans(projectPath: string): Promise<PlanDoc[]>
  createPlan(projectPath: string, title: string): Promise<PlanDoc>
  updatePlan(projectPath: string, id: string, updates: { title?: string; body?: string }): Promise<PlanDoc | null>
  deletePlan(projectPath: string, id: string): Promise<void>

  // Files (universal explorer)
  listDir(projectPath: string, relPath: string): Promise<FileEntry[]>
  readFile(projectPath: string, relPath: string): Promise<FileContent>
  writeFile(projectPath: string, relPath: string, content: string): Promise<void>

  // Skills
  listSkills(projectPath: string): Promise<SkillDoc[]>
  createSkill(projectPath: string, name: string): Promise<SkillDoc>
  updateSkill(projectPath: string, id: string, updates: { name?: string; description?: string; body?: string }): Promise<SkillDoc | null>
  deleteSkill(projectPath: string, id: string): Promise<void>

  // Capture
  submitCapture(raw: string, projectPath: string): Promise<Card>
  closeCaptureWindow(): Promise<void>
  getDefaultProjectPath(): Promise<string | null>
  signalCaptureReady(): void
  onCaptureShown(callback: () => void): () => void

  // Window chrome (theme sync)
  setWindowChrome(chrome: { bg: string; symbol: string }): Promise<void>
  setCaptureShortcut(shortcut: ShortcutBinding): Promise<boolean>

  // Events: Main → Renderer
  onBoardChanged(callback: (data: { projectPath: string }) => void): () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
