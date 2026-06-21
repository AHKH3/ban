import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  submitCapture: (raw: string, projectPath: string) => ipcRenderer.invoke('capture:submit', raw, projectPath),
  closeCaptureWindow: () => ipcRenderer.invoke('capture:close'),
  getDefaultProjectPath: () => ipcRenderer.invoke('project:get-last'),
})
