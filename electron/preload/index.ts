import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Project
  openProjectDialog: () => ipcRenderer.invoke('project:open-dialog'),
  openProject: (projectPath: string) => ipcRenderer.invoke('project:open', projectPath),
  initProject: (projectPath: string) => ipcRenderer.invoke('project:init', projectPath),
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

  // Agents (rules projection)
  getAgents: (projectPath: string) => ipcRenderer.invoke('agents:get', projectPath),
  setSelectedAgents: (projectPath: string, selected: string[]) =>
    ipcRenderer.invoke('agents:set-selected', projectPath, selected),
  saveAgentRules: (projectPath: string, content: string) =>
    ipcRenderer.invoke('agents:save-rules', projectPath, content),

  // Plans
  listPlans: (projectPath: string) => ipcRenderer.invoke('plans:list', projectPath),
  createPlan: (projectPath: string, title: string) => ipcRenderer.invoke('plans:create', projectPath, title),
  updatePlan: (projectPath: string, id: string, updates: Record<string, unknown>) =>
    ipcRenderer.invoke('plans:update', projectPath, id, updates),
  deletePlan: (projectPath: string, id: string) => ipcRenderer.invoke('plans:delete', projectPath, id),

  // Files (universal explorer)
  listDir: (projectPath: string, relPath: string) => ipcRenderer.invoke('files:list', projectPath, relPath),
  readFile: (projectPath: string, relPath: string) => ipcRenderer.invoke('files:read', projectPath, relPath),
  writeFile: (projectPath: string, relPath: string, content: string) =>
    ipcRenderer.invoke('files:write', projectPath, relPath, content),

  // Skills
  listSkills: (projectPath: string) => ipcRenderer.invoke('skills:list', projectPath),
  createSkill: (projectPath: string, name: string) => ipcRenderer.invoke('skills:create', projectPath, name),
  updateSkill: (projectPath: string, id: string, updates: Record<string, unknown>) =>
    ipcRenderer.invoke('skills:update', projectPath, id, updates),
  deleteSkill: (projectPath: string, id: string) => ipcRenderer.invoke('skills:delete', projectPath, id),

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
