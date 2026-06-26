import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Project
  openProjectDialog: () => ipcRenderer.invoke('project:open-dialog'),
  openProject: (projectPath: string) => ipcRenderer.invoke('project:open', projectPath),
  initProject: (projectPath: string) => ipcRenderer.invoke('project:init', projectPath),
  getProjectVersioningSettings: (projectPath: string) =>
    ipcRenderer.invoke('project:get-versioning-settings', projectPath),
  updateProjectVersioningSettings: (projectPath: string, settings: Record<string, unknown>) =>
    ipcRenderer.invoke('project:update-versioning-settings', projectPath, settings),
  getRecentProjects: () => ipcRenderer.invoke('project:get-recent'),
  getDefaultProjectPath: () => ipcRenderer.invoke('project:get-last'),

  // Cards
  createCard: (data: Record<string, unknown>) => ipcRenderer.invoke('card:create', data),
  updateCard: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('card:update', id, data),
  moveCard: (id: string, newStatus: string, projectPath: string) =>
    ipcRenderer.invoke('card:move', id, newStatus, projectPath),
  deleteCard: (id: string, projectPath: string) => ipcRenderer.invoke('card:delete', id, projectPath),

  // Search
  searchCards: (query: string, projectPath: string) => ipcRenderer.invoke('search:query', query, projectPath),

  // Activity
  getActivityEvents: (projectPath: string, range: Record<string, unknown>) =>
    ipcRenderer.invoke('activity:list', projectPath, range),

  // Files (universal explorer)
  listDir: (projectPath: string, relPath: string) => ipcRenderer.invoke('files:list', projectPath, relPath),
  readFile: (projectPath: string, relPath: string) => ipcRenderer.invoke('files:read', projectPath, relPath),
  writeFile: (projectPath: string, relPath: string, content: string) =>
    ipcRenderer.invoke('files:write', projectPath, relPath, content),

  // Capture
  submitCapture: (raw: string, projectPath: string) => ipcRenderer.invoke('capture:submit', raw, projectPath),
  closeCaptureWindow: () => ipcRenderer.invoke('capture:close'),

  // Window chrome (theme sync)
  setWindowChrome: (chrome: { bg: string; symbol: string }) => ipcRenderer.invoke('window:set-chrome', chrome),
  setCaptureShortcut: (shortcut: Record<string, unknown>) => ipcRenderer.invoke('shortcuts:set-capture', shortcut),

  // Events: main → renderer
  onBoardChanged: (callback: (data: { projectPath: string }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { projectPath: string }) => callback(data)
    ipcRenderer.on('board:changed', handler)
    return () => ipcRenderer.removeListener('board:changed', handler)
  },
})
