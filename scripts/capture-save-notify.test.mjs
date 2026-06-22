import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const captureIpcSource = readFileSync(new URL('../electron/ipc/capture.ts', import.meta.url), 'utf8')
const ipcIndexSource = readFileSync(new URL('../electron/ipc/index.ts', import.meta.url), 'utf8')

assert.match(
  captureIpcSource,
  /getMainWindow: \(\) => BrowserWindow \| null/,
  'capture IPC should receive the main window so it can refresh the board after saving',
)

assert.match(
  captureIpcSource,
  /webContents\.send\('board:changed', \{ projectPath \}\)/,
  'capture submit should notify the main board after writing a captured card',
)

assert.match(
  ipcIndexSource,
  /setupCaptureIPC\(getMainWindow, getCaptureWindow\)/,
  'IPC setup should pass the main window into capture IPC',
)
