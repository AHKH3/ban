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

assert.match(
  boardCardSource,
  /selected-card-check[\s\S]*rounded-full/,
  'selected board card check badge should be circular',
)

assert.doesNotMatch(
  boardCardSource,
  /absolute inset-x-0 bottom-0 h-1 bg-accent/,
  'selected board cards should not use a full-width bottom accent bar',
)

assert.doesNotMatch(
  boardCardSource,
  /isSelected\s+\?\s+['"`][^'"`]*bg-accent-soft\/20/,
  'selected board cards should stay on the card surface instead of turning into a pale accent block',
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

assert.doesNotMatch(
  journeySource,
  /absolute inset-x-0 bottom-0 h-1 bg-accent/,
  'active journey cards should not use a full-width bottom accent bar',
)

assert.doesNotMatch(
  journeySource,
  /isActive\s*\?[\s\S]*?bg-accent-soft\/20/,
  'active journey cards should stay on the card surface instead of turning into a pale accent block',
)
