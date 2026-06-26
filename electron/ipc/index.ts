import { BrowserWindow } from 'electron'
import { setupProjectIPC } from './project'
import { setupCardsIPC } from './cards'
import { setupSearchIPC } from './search'
import { setupCaptureIPC } from './capture'
import { setupWindowIPC } from './window'
import { setupActivityIPC } from './activity'
import { setupFilesIPC } from './files'

export function setupIPC(
  getMainWindow: () => BrowserWindow | null,
  getCaptureWindow: () => BrowserWindow | null
): void {
  setupProjectIPC(getMainWindow, getCaptureWindow)
  setupCardsIPC()
  setupSearchIPC()
  setupCaptureIPC(getMainWindow, getCaptureWindow)
  setupWindowIPC(getMainWindow)
  setupActivityIPC()
  setupFilesIPC()
}
