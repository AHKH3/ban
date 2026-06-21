import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import * as path from 'path'
import { createMainWindow, createCaptureWindow } from './windows'
import { setupIPC } from './ipc'
import { DEFAULT_SHORTCUTS, shortcutToAccelerator } from '../lib/shortcuts'
import type { ShortcutBinding } from '../lib/shortcuts'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let captureWindow: BrowserWindow | null = null
let captureAccelerator: string | null = null

function showCaptureWindow() {
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.show()
    captureWindow.focus()
  } else {
    captureWindow = createCaptureWindow(isDev)
    captureWindow.on('closed', () => { captureWindow = null })
  }
}

function registerCaptureShortcut(shortcut: ShortcutBinding): boolean {
  const accelerator = shortcutToAccelerator(shortcut) ?? shortcutToAccelerator(DEFAULT_SHORTCUTS.capture)
  if (!accelerator) return false

  if (captureAccelerator) globalShortcut.unregister(captureAccelerator)
  const registered = globalShortcut.register(accelerator, showCaptureWindow)
  if (registered) {
    captureAccelerator = accelerator
    return true
  }

  const fallback = shortcutToAccelerator(DEFAULT_SHORTCUTS.capture)
  if (fallback && fallback !== accelerator) {
    globalShortcut.register(fallback, showCaptureWindow)
    captureAccelerator = fallback
  }
  return false
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.ban.kanban-capture')
  mainWindow = createMainWindow(isDev)
  setupIPC(() => mainWindow, () => captureWindow)

  registerCaptureShortcut(DEFAULT_SHORTCUTS.capture)

  ipcMain.handle('shortcuts:set-capture', (_event, shortcut: ShortcutBinding) => {
    return registerCaptureShortcut(shortcut)
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
