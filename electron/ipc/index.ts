import { BrowserWindow } from 'electron'
import { setupProjectIPC } from './project'
import { setupCardsIPC } from './cards'
import { setupSearchIPC } from './search'
import { setupCaptureIPC } from './capture'
import { setupWindowIPC } from './window'
import { setupActivityIPC } from './activity'
import { setupAgentsIPC } from './agents'
import { setupPlansIPC } from './plans'
import { setupFilesIPC } from './files'
import { setupSkillsIPC } from './skills'
import { setupOrchestrationIPC } from './orchestration'

export function setupIPC(
  getMainWindow: () => BrowserWindow | null,
  getCaptureWindow: () => BrowserWindow | null
): void {
  setupProjectIPC(getMainWindow)
  setupCardsIPC()
  setupSearchIPC()
  setupCaptureIPC(getMainWindow, getCaptureWindow)
  setupWindowIPC(getMainWindow)
  setupActivityIPC()
  setupAgentsIPC()
  setupPlansIPC()
  setupFilesIPC()
  setupSkillsIPC()
  setupOrchestrationIPC(getMainWindow)
}
