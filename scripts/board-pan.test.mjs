import assert from 'node:assert/strict'
import { shouldStartBoardPan } from '../lib/board-pan.ts'

function targetWithClosest(selectorMatches = []) {
  return {
    closest(selector) {
      const selectors = selector.split(',').map(part => part.trim())
      return selectors.some(part => selectorMatches.includes(part)) ? {} : null
    },
  }
}

assert.equal(
  shouldStartBoardPan({ button: 0, target: targetWithClosest() }),
  true,
  'primary mouse button on empty board space should start panning',
)

assert.equal(
  shouldStartBoardPan({ button: 1, target: targetWithClosest() }),
  false,
  'non-primary mouse buttons should not start panning',
)

assert.equal(
  shouldStartBoardPan({ button: 0, target: targetWithClosest(['button']) }),
  false,
  'buttons should keep their native interaction',
)

assert.equal(
  shouldStartBoardPan({ button: 0, target: targetWithClosest(['[draggable="true"]']) }),
  false,
  'draggable cards should keep card dragging behavior',
)
