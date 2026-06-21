import test from 'node:test'
import assert from 'node:assert/strict'
import { nextCardId } from '../electron/fs/card-id'

test('starts card ids at 001 when the board has no numeric ids', () => {
  assert.equal(nextCardId([]), '001')
  assert.equal(nextCardId(['global-capture__ptJF8a_T', 'RyytBaZ-']), '001')
})

test('increments the highest numeric card id using three digits', () => {
  assert.equal(nextCardId(['001', '002']), '003')
  assert.equal(nextCardId(['007', 'abc123', '012']), '013')
})

test('continues past 999 without truncating', () => {
  assert.equal(nextCardId(['998', '999']), '1000')
})
