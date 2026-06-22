import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { initProject } from '../electron/fs/project'

test('initProject ignores only the hidden .ban app-data folder', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))

  initProject(dir)

  const gitignore = fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8')
  assert.match(gitignore, /^\.ban\/$/m)
  // Tasks/ is committed truth — it must never be ignored.
  assert.doesNotMatch(gitignore, /^Tasks\/?$/m)
})

test('initProject appends the Ban ignore rule without duplicating it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))
  const gitignorePath = path.join(dir, '.gitignore')
  fs.writeFileSync(gitignorePath, 'node_modules/\n', 'utf-8')

  initProject(dir)
  initProject(dir)

  const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
  assert.match(gitignore, /^node_modules\/$/m)
  assert.equal(gitignore.match(/^\.ban\/$/gm)?.length, 1)
})

test('initProject drops a legacy .kanban ignore rule (Tasks/ is now committed)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))
  const gitignorePath = path.join(dir, '.gitignore')
  fs.writeFileSync(gitignorePath, 'node_modules/\n.kanban/\n', 'utf-8')

  initProject(dir)

  const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
  assert.doesNotMatch(gitignore, /^\.kanban\/?$/m)
  assert.match(gitignore, /^\.ban\/$/m)
  assert.match(gitignore, /^node_modules\/$/m)
})
