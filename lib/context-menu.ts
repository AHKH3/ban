export interface ContextMenuPositionInput {
  clientX: number
  clientY: number
  menuWidth: number
  menuHeight: number
  viewportWidth: number
  viewportHeight: number
}

const VIEWPORT_GAP = 8

export function getContextMenuPosition(input: ContextMenuPositionInput) {
  const maxX = Math.max(VIEWPORT_GAP, input.viewportWidth - input.menuWidth - VIEWPORT_GAP)
  const maxY = Math.max(VIEWPORT_GAP, input.viewportHeight - input.menuHeight - VIEWPORT_GAP)

  return {
    x: Math.min(Math.max(input.clientX, VIEWPORT_GAP), maxX),
    y: Math.min(Math.max(input.clientY, VIEWPORT_GAP), maxY),
  }
}
