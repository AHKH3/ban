import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appChunkDir = fileURLToPath(new URL('../out/_next/static/chunks/app', import.meta.url))

assert.ok(existsSync(appChunkDir), 'packaged renderer chunks should exist after npm run build')

const appBundle = readdirSync(appChunkDir)
  .filter(file => file.endsWith('.js'))
  .map(file => readFileSync(join(appChunkDir, file), 'utf8'))
  .join('\n')

assert.match(
  appBundle,
  /selected-card-check/,
  'packaged board bundle should include the selected card check badge',
)

assert.doesNotMatch(
  appBundle,
  /0_0_0_1px_var\(--accent-soft\)|0_14px_38px|ring-2 ring-accent/,
  'packaged board bundle should not include the old focus-ring selection styling',
)

assert.doesNotMatch(
  appBundle,
  /inset-1 rounded-md border border-accent-border|inset-2 rounded-md border border-accent-border/,
  'packaged journey bundle should not include the old active-card overlay rings',
)
