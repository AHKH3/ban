import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getContextMenuPosition } from '../lib/context-menu.ts'

assert.deepEqual(
  getContextMenuPosition({
    clientX: 120,
    clientY: 80,
    menuWidth: 220,
    menuHeight: 260,
    viewportWidth: 900,
    viewportHeight: 700,
  }),
  { x: 120, y: 80 },
  'context menu should open at the pointer when it fits on screen',
)

assert.deepEqual(
  getContextMenuPosition({
    clientX: 840,
    clientY: 650,
    menuWidth: 220,
    menuHeight: 260,
    viewportWidth: 900,
    viewportHeight: 700,
  }),
  { x: 672, y: 432 },
  'context menu should stay inside the visible viewport near screen edges',
)

const cardItemSource = readFileSync(new URL('../components/board/CardItem.tsx', import.meta.url), 'utf8')

assert.match(
  cardItemSource,
  /onContextMenu=/,
  'board cards should open the Ban context menu on right click',
)

assert.match(
  cardItemSource,
  /ContextMenu/,
  'board cards should render the shared app-styled context menu',
)

assert.match(
  cardItemSource,
  /deleteCard/,
  'card context menu should include a delete action',
)

assert.doesNotMatch(
  cardItemSource,
  /items:\s*ALL_STATUSES\.map\(status/,
  'card context menu should collapse statuses behind the current status row',
)

assert.match(
  cardItemSource,
  /context\.status/,
  'card context menu should include a collapsed status control',
)

assert.match(
  cardItemSource,
  /context\.priority/,
  'card context menu should include a collapsed priority control',
)

assert.match(
  cardItemSource,
  /context\.tags/,
  'card context menu should include a tags control',
)

assert.match(
  cardItemSource,
  /context\.addTag/,
  'card context menu should allow adding a new tag',
)

const contextMenuSource = readFileSync(new URL('../components/ui/ContextMenu.tsx', import.meta.url), 'utf8')

assert.match(
  contextMenuSource,
  /submenu/,
  'shared context menu should support click-open submenus',
)
