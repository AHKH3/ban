import { BrowserWindow } from 'electron'
import { setupProjectIPC } from './project'
import { setupCardsIPC } from './cards'
import { setupSearchIPC } from './search'
import { setupCaptureIPC } from './capture'
import { setupWindowIPC } from './window'

export function setupIPC(
  getMainWindow: () => BrowserWindow | null,
  getCaptureWindow: () => BrowserWindow | null
): void {
  setupProjectIPC(getMainWindow)
  setupCardsIPC()
  setupSearchIPC()
  setupCaptureIPC(getCaptureWindow)
  setupWindowIPC(getMainWindow)
}
