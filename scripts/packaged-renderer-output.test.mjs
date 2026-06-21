import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const windowsSource = readFileSync(new URL('../electron/windows.ts', import.meta.url), 'utf8')

assert.match(
  windowsSource,
  /const RENDERER_OUT = path\.join\(__dirname, '\.\.', '\.\.', 'out'\)/,
  'packaged Electron renderer should load the out directory',
)

assert.doesNotMatch(
  packageJson.scripts.build,
  /NEXT_DIST_DIR/,
  'production build should not redirect the exported renderer away from out',
)
