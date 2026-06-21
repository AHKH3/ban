import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { initProject } from '../electron/fs/project'

test('initProject creates a project gitignore that excludes local Ban data', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))

  initProject(dir)

  assert.match(fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8'), /^\.kanban\/$/m)
})

test('initProject appends the Ban ignore rule without duplicating it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))
  const gitignorePath = path.join(dir, '.gitignore')
  fs.writeFileSync(gitignorePath, 'node_modules/\n', 'utf-8')

  initProject(dir)
  initProject(dir)

  const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
  assert.match(gitignore, /^node_modules\/$/m)
  assert.equal(gitignore.match(/^\.kanban\/$/gm)?.length, 1)
})
