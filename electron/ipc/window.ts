import { ipcMain, BrowserWindow } from 'electron'

interface Chrome {
  bg: string
  symbol: string
}

/** Lets the renderer keep the native window chrome (titlebar overlay + bg)
 *  in sync with the active theme so light themes don't show dark chrome. */
export function setupWindowIPC(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('window:set-chrome', async (_e: Electron.IpcMainInvokeEvent, chrome: Chrome) => {
    const win = getMainWindow()
    if (!win || win.isDestroyed()) return
    try {
      win.setBackgroundColor(chrome.bg)
      if (typeof win.setTitleBarOverlay === 'function') {
        win.setTitleBarOverlay({ color: chrome.bg, symbolColor: chrome.symbol, height: 40 })
      }
    } catch {
      /* setTitleBarOverlay only valid when titleBarOverlay enabled */
    }
  })
}
