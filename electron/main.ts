import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import * as path from 'path'
import { createMainWindow, createCaptureWindow } from './windows'
import { setupIPC } from './ipc'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let captureWindow: BrowserWindow | null = null

app.whenReady().then(async () => {
  mainWindow = createMainWindow(isDev)
  setupIPC(() => mainWindow, () => captureWindow)

  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (captureWindow && !captureWindow.isDestroyed()) {
      captureWindow.show()
      captureWindow.focus()
    } else {
      captureWindow = createCaptureWindow(isDev)
      captureWindow.on('closed', () => { captureWindow = null })
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow(isDev)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
