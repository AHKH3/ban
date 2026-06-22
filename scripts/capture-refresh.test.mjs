import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const mainSource = readFileSync(new URL('../electron/main.ts', import.meta.url), 'utf8')
const preloadSource = readFileSync(new URL('../electron/preload/capture.ts', import.meta.url), 'utf8')
const inputSource = readFileSync(new URL('../components/capture/CaptureInput.tsx', import.meta.url), 'utf8')

assert.match(
  mainSource,
  /webContents\.send\('capture:shown'\)/,
  'reused capture windows should notify the renderer whenever they are shown',
)

assert.match(
  preloadSource,
  /onCaptureShown:/,
  'capture preload should expose a safe capture shown subscription',
)

assert.match(
  inputSource,
  /onCaptureShown/,
  'capture input should refresh its target project when the existing capture window is shown again',
)
