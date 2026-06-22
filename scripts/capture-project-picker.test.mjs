import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const preloadSource = readFileSync(new URL('../electron/preload/capture.ts', import.meta.url), 'utf8')
const inputSource = readFileSync(new URL('../components/capture/CaptureInput.tsx', import.meta.url), 'utf8')

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
