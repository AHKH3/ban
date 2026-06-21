import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../components/journey/JourneyView.tsx', import.meta.url), 'utf8')

assert.match(
  source,
  /import \{ shouldStartBoardPan \} from '@\/lib\/board-pan'/,
  'journey view should reuse board pan interaction guard',
)

assert.match(source, /onPointerDown=\{/, 'journey board should start panning from pointer down')
assert.match(source, /onPointerMove=\{/, 'journey board should move while panning')
assert.match(source, /scrollLeft -=/, 'journey board should pan by changing horizontal scroll')
