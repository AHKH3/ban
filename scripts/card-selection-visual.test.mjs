import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const boardCardSource = readFileSync(new URL('../components/board/CardItem.tsx', import.meta.url), 'utf8')
const journeySource = readFileSync(new URL('../components/journey/JourneyView.tsx', import.meta.url), 'utf8')

assert.doesNotMatch(
  boardCardSource,
  /isSelected\s+\?\s+['"`][^'"`]*ring-/,
  'selected board cards should not use focus rings',
)

assert.match(
  boardCardSource,
  /selected-card-check/,
  'selected board cards should render an inline check badge',
)

assert.doesNotMatch(
  journeySource,
  /scale:\s*isActive\s*\?/,
  'active journey cards should not scale and shift from their slot',
)

assert.doesNotMatch(
  journeySource,
  /absolute inset-[12][^'"`]*border border-accent-border/,
  'active journey cards should not draw focus rings over the card',
)
