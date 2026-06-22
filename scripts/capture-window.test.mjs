import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../electron/windows.ts', import.meta.url), 'utf8')

assert.match(
  source,
  /webContents\.on\('before-input-event'/,
  'capture window should handle Escape in the main process so dismissal still works if renderer handlers are not active',
)

assert.match(
  source,
  /input\.key === 'Escape'/,
  'capture window main-process key handler should close on Escape',
)

assert.doesNotMatch(
  source,
  /setTimeout\(\(\) => reveal\(\), 2000\)/,
  'capture window should not reveal a non-interactive SSR shell from a timeout fallback',
)
