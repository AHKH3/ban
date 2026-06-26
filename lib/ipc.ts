import type { BoardData, Card, Project, SearchResult, NewCardInput, ActivityEvent, ActivityRange, FileEntry, FileContent, ProjectVersioningSettings } from './types'
import type { ShortcutBinding } from './shortcuts'

export interface ElectronAPI {
  // Project
  openProjectDialog(): Promise<string | null>
  openProject(projectPath: string): Promise<BoardData>
  initProject(projectPath: string): Promise<void>
  getProjectVersioningSettings(projectPath: string): Promise<ProjectVersioningSettings>
  updateProjectVersioningSettings(
    projectPath: string,
    settings: ProjectVersioningSettings
  ): Promise<ProjectVersioningSettings>
  getRecentProjects(): Promise<Project[]>
  getDefaultProjectPath(): Promise<string | null>

  // Cards
  createCard(data: NewCardInput & { projectPath: string }): Promise<Card>
  updateCard(id: string, data: Partial<NewCardInput> & { projectPath: string }): Promise<Card>
  moveCard(id: string, newStatus: string, projectPath: string): Promise<void>
  deleteCard(id: string, projectPath: string): Promise<void>

  // Search
  searchCards(query: string, projectPath: string): Promise<SearchResult[]>

  // Activity
  getActivityEvents(projectPath: string, range: ActivityRange): Promise<ActivityEvent[]>

  // Files (universal explorer)
  listDir(projectPath: string, relPath: string): Promise<FileEntry[]>
  readFile(projectPath: string, relPath: string): Promise<FileContent>
  writeFile(projectPath: string, relPath: string, content: string): Promise<void>

  // Capture
  submitCapture(raw: string, projectPath: string): Promise<Card>
  closeCaptureWindow(): Promise<void>
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
