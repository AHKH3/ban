import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { initProject, updateProjectVersioningSettings } from '../electron/fs/project'

test('initProject ignores Ban-managed non-code files by default', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))

  initProject(dir)

  const gitignore = fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8')
  assert.match(gitignore, /^\.ban\/$/m)
  assert.match(gitignore, /^Tasks\/$/m)
  assert.match(gitignore, /^Plans\/$/m)
  assert.match(gitignore, /^Skills\/$/m)
  assert.match(gitignore, /^RULES\.md$/m)
  assert.match(gitignore, /^AGENTS\.md$/m)
  assert.match(gitignore, /^CLAUDE\.md$/m)
  assert.match(gitignore, /^\.kanban\/$/m)
})

test('initProject appends Ban ignore rules without duplicating them', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))
  const gitignorePath = path.join(dir, '.gitignore')
  fs.writeFileSync(gitignorePath, 'node_modules/\n.ban\nTasks\n', 'utf-8')

  initProject(dir)
  initProject(dir)

  const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
  assert.match(gitignore, /^node_modules\/$/m)
  assert.doesNotMatch(gitignore, /^\.ban$/m)
  assert.doesNotMatch(gitignore, /^Tasks$/m)
  assert.equal(gitignore.match(/^\.ban\/$/gm)?.length, 1)
  assert.equal(gitignore.match(/^Tasks\/$/gm)?.length, 1)
})

test('versioning settings let a project opt Ban folders back into git', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-project-'))
  const gitignorePath = path.join(dir, '.gitignore')
  fs.writeFileSync(gitignorePath, 'node_modules/\nTasks/\nPlans/\n', 'utf-8')

  initProject(dir)
  updateProjectVersioningSettings(dir, {
    trackTasks: true,
    trackPlans: true,
    trackSkills: false,
    trackAgentRules: false,
  })

  const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
  assert.match(gitignore, /^\.ban\/$/m)
  assert.match(gitignore, /^node_modules\/$/m)
  assert.doesNotMatch(gitignore, /^Tasks\/$/m)
  assert.doesNotMatch(gitignore, /^Plans\/$/m)
  assert.match(gitignore, /^Skills\/$/m)
  assert.match(gitignore, /^RULES\.md$/m)
})
