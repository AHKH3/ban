import assert from 'node:assert/strict'
import { getDraggedCardIds } from '../lib/card-selection.ts'

assert.deepEqual(
  getDraggedCardIds('card-2', new Set(['card-1', 'card-2', 'card-3'])),
  ['card-1', 'card-2', 'card-3'],
  'dragging a selected card should drag the whole selected group',
)

assert.deepEqual(
  getDraggedCardIds('card-4', new Set(['card-1', 'card-2', 'card-3'])),
  ['card-4'],
  'dragging an unselected card should drag only that card',
)
