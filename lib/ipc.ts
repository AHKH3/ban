import type { BoardData, Card, Project, SearchResult, NewCardInput, ActivityEvent, ActivityRange } from './types'
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

  // Capture
  submitCapture(raw: string, projectPath: string): Promise<Card>
  closeCaptureWindow(): Promise<void>
  getDefaultProjectPath(): Promise<string | null>
  signalCaptureReady(): void

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
