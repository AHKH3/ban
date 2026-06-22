import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import matter from 'gray-matter'
import test from 'node:test'
import assert from 'node:assert/strict'
import { initProject, readBoard } from '../electron/fs/project'

test('initProject migrates legacy card files to numeric ids in Tasks/', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))
  const legacyReadyDir = path.join(dir, '.kanban', 'columns', 'ready')
  fs.mkdirSync(legacyReadyDir, { recursive: true })
  fs.writeFileSync(
    path.join(legacyReadyDir, 'legacy-card__abc123.md'),
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

  // The hidden legacy folder is gone; the card now lives in the visible Tasks/ folder.
  assert.equal(fs.existsSync(path.join(dir, '.kanban')), false)
  const migratedPath = path.join(dir, 'Tasks', 'ready', 'legacy-card__001.md')
  assert.equal(fs.existsSync(migratedPath), true)
  assert.equal(matter(fs.readFileSync(migratedPath, 'utf-8')).data.id, '001')
})

test('initProject relocates legacy app metadata into .ban/', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))
  fs.mkdirSync(path.join(dir, '.kanban'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kanban', 'config.json'), JSON.stringify({ name: 'Legacy' }), 'utf-8')

  initProject(dir)

  assert.equal(fs.existsSync(path.join(dir, '.kanban')), false)
  const config = JSON.parse(fs.readFileSync(path.join(dir, '.ban', 'config.json'), 'utf-8'))
  assert.equal(config.name, 'Legacy')
})

test('readBoard applies gitignore, migration, and reads cards from Tasks/', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))
  const legacyInboxDir = path.join(dir, '.kanban', 'columns', 'inbox')
  fs.mkdirSync(legacyInboxDir, { recursive: true })
  fs.writeFileSync(path.join(dir, '.kanban', 'config.json'), JSON.stringify({ name: 'Project' }), 'utf-8')
  fs.writeFileSync(
    path.join(legacyInboxDir, 'first__old-id.md'),
    matter.stringify('# First\n', { id: 'old-id', status: 'inbox', type: 'task', priority: 'normal', tags: [] }),
    'utf-8'
  )

  const board = readBoard(dir)

  assert.match(fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8'), /^\.ban\/$/m)
  assert.equal(board.columns.inbox[0].id, '001')
  assert.equal(board.columns.inbox[0].fileName, 'first__001.md')
  assert.equal(fs.existsSync(path.join(dir, 'Tasks', 'inbox', 'first__001.md')), true)
})
