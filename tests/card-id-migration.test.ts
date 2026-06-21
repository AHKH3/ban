import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import matter from 'gray-matter'
import test from 'node:test'
import assert from 'node:assert/strict'
import { initProject, readBoard } from '../electron/fs/project'

test('initProject migrates legacy card files to numeric ids', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))
  const readyDir = path.join(dir, '.kanban', 'columns', 'ready')
  fs.mkdirSync(readyDir, { recursive: true })
  fs.writeFileSync(
    path.join(readyDir, 'legacy-card__abc123.md'),
    matter.stringify('# Legacy card\n', {
      id: 'abc123',
      status: 'ready',
      type: 'task',
      priority: 'normal',
      tags: [],
      createdAt: '2026-06-21T00:00:00.000Z',
      updatedAt: '2026-06-21T00:00:00.000Z',
    }),
    'utf-8'
  )

  initProject(dir)

  const migratedPath = path.join(readyDir, 'legacy-card__001.md')
  assert.equal(fs.existsSync(path.join(readyDir, 'legacy-card__abc123.md')), false)
  assert.equal(fs.existsSync(migratedPath), true)
  assert.equal(matter(fs.readFileSync(migratedPath, 'utf-8')).data.id, '001')
})

test('readBoard also applies default gitignore and id migration to existing boards', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))
  const inboxDir = path.join(dir, '.kanban', 'columns', 'inbox')
  fs.mkdirSync(inboxDir, { recursive: true })
  fs.writeFileSync(path.join(dir, '.kanban', 'config.json'), JSON.stringify({ name: 'Project' }), 'utf-8')
  fs.writeFileSync(
    path.join(inboxDir, 'first__old-id.md'),
    matter.stringify('# First\n', { id: 'old-id', status: 'inbox', type: 'task', priority: 'normal', tags: [] }),
    'utf-8'
  )

  const board = readBoard(dir)

  assert.match(fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8'), /^\.kanban\/$/m)
  assert.equal(board.columns.inbox[0].id, '001')
  assert.equal(board.columns.inbox[0].fileName, 'first__001.md')
})
