import { BrowserWindow, app } from 'electron'
import * as path from 'path'

const RENDERER_URL = 'http://localhost:3000'
// __dirname in prod = dist-electron/electron/, so go up two levels to reach project root
const RENDERER_OUT = path.join(__dirname, '..', '..', 'out')

// In a packaged build the asar boundary means __dirname can't reach resources/;
// instead electron exposes process.resourcesPath which always points to the
// real resources folder alongside the asar.
const APP_ICON = app.isPackaged
  ? path.join(process.resourcesPath, 'icon.png')
  : path.join(__dirname, '..', '..', 'resources', 'icon.png')

export function createMainWindow(isDev: boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: APP_ICON,
    backgroundColor: '#08090A',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0F1011',
      symbolColor: '#B7BBC5',
      height: 40,
    },
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  if (isDev) {
    win.loadURL(RENDERER_URL)
  } else {
    win.loadFile(path.join(RENDERER_OUT, 'index.html'))
  }

  win.once('ready-to-show', () => win.show())

  return win
}

export function createCaptureWindow(isDev: boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 620,
    height: 88,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#0F1011',
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'capture.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  if (isDev) {
    win.loadURL(`${RENDERER_URL}/capture`)
  } else {
    win.loadFile(path.join(RENDERER_OUT, 'capture', 'index.html'))
  }

  win.once('ready-to-show', () => win.show())
  win.on('blur', () => {
    if (!win.isDestroyed()) win.hide()
  })

  return win
}
