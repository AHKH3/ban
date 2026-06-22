import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  submitCapture: (raw: string, projectPath: string) => ipcRenderer.invoke('capture:submit', raw, projectPath),
  closeCaptureWindow: () => ipcRenderer.invoke('capture:close'),
  getDefaultProjectPath: () => ipcRenderer.invoke('project:get-last'),
  signalCaptureReady: () => ipcRenderer.send('capture:ready'),
  onCaptureShown: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('capture:shown', handler)
    return () => ipcRenderer.removeListener('capture:shown', handler)
  },
})
