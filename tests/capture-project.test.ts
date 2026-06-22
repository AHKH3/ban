import test from 'node:test'
import assert from 'node:assert/strict'
import { selectDefaultProjectPath } from '../lib/capture-project.ts'

test('uses the last opened project as the capture target', () => {
  assert.equal(
    selectDefaultProjectPath('C:\\dev\\Ban', [
      { path: 'C:\\dev\\Lare', name: 'Lare', lastOpenedAt: '2026-06-22T00:00:00.000Z' },
    ]),
    'C:\\dev\\Ban',
  )
})

test('falls back to the most recent project when no last project is stored', () => {
  assert.equal(
    selectDefaultProjectPath(null, [
      { path: 'C:\\dev\\Ban', name: 'Ban', lastOpenedAt: '2026-06-22T00:00:00.000Z' },
    ]),
    'C:\\dev\\Ban',
  )
})

test('returns null when there is no capture target', () => {
  assert.equal(selectDefaultProjectPath(null, []), null)
})
