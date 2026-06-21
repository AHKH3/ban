/**
 * Deterministic per-tag color. The same tag name always maps to the same hue,
 * so tags are visually consistent across the board. Uses HSL so the colors
 * read well on both dark and light themes.
 */
export interface TagColor {
  text: string
  bg: string
  border: string
}

const cache = new Map<string, TagColor>()

export function tagColor(tag: string): TagColor {
  const key = tag.toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  // FNV-ish hash → stable hue
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0
  }
  const hue = h % 360
  // Nudge away from muddy yellow-greens for better legibility
  const adjusted = (hue + 15) % 360

  const color: TagColor = {
    text: `hsl(${adjusted} 60% 62%)`,
    bg: `hsl(${adjusted} 60% 50% / 0.14)`,
    border: `hsl(${adjusted} 55% 55% / 0.30)`,
  }
  cache.set(key, color)
  return color
}
