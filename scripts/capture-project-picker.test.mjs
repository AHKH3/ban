import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const preloadSource = readFileSync(new URL('../electron/preload/capture.ts', import.meta.url), 'utf8')
const inputSource = readFileSync(new URL('../components/capture/CaptureInput.tsx', import.meta.url), 'utf8')
const layoutSource = readFileSync(new URL('../app/capture/layout.tsx', import.meta.url), 'utf8')
const projectIpcSource = readFileSync(new URL('../electron/ipc/project.ts', import.meta.url), 'utf8')
const ipcIndexSource = readFileSync(new URL('../electron/ipc/index.ts', import.meta.url), 'utf8')
const windowsSource = readFileSync(new URL('../electron/windows.ts', import.meta.url), 'utf8')

assert.match(
  preloadSource,
  /getRecentProjects:/,
  'capture preload should expose recent projects so the capture window can choose a target',
)

assert.match(
  preloadSource,
  /openProjectDialog:/,
  'capture preload should expose the project folder picker',
)

assert.match(
  preloadSource,
  /openProject:/,
  'capture preload should let a selected capture target become the persisted recent project',
)

assert.match(
  inputSource,
  /getRecentProjects/,
  'capture input should load recent projects for target selection',
)

assert.match(
  inputSource,
  /openProjectDialog/,
  'capture input should allow choosing a different project folder',
)

assert.doesNotMatch(
  inputSource,
  /onSubmit=\{handleSubmit\}\s+dir="ltr"\s+className="titlebar-drag/,
  'capture form should not be a draggable region because it contains interactive controls',
)

assert.match(
  inputSource,
  /id="capture-drag-handle"/,
  'capture window should keep a small dedicated drag handle instead of making the whole form draggable',
)

assert.match(
  layoutSource,
  /#capture-root button,#capture-root input\{[^}]*-webkit-app-region:no-drag/,
  'capture controls must explicitly opt out of Electron drag regions',
)

assert.match(
  inputSource,
  /recentProjects\.length === 0\s*\?\s*chooseProjectFolder\(\)\s*:\s*setProjectPickerOpen/,
  'capture choose-project button should open the folder picker directly when there are no recent projects',
)

assert.match(
  ipcIndexSource,
  /setupProjectIPC\(getMainWindow,\s*getCaptureWindow\)/,
  'project IPC should receive the capture window so capture-specific dialogs can be handled',
)

assert.match(
  projectIpcSource,
  /BrowserWindow\.fromWebContents\(event\.sender\)/,
  'project folder dialog should be parented to the window that invoked it',
)

assert.match(
  projectIpcSource,
  /withCaptureAutoHideSuspended/,
  'capture project folder dialog should suspend capture auto-hide while the native dialog owns focus',
)

assert.match(
  windowsSource,
  /export async function withCaptureAutoHideSuspended/,
  'capture window should expose a scoped auto-hide suspension helper',
)
