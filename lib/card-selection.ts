export function getDraggedCardIds(draggedCardId: string, selectedCardIds: Set<string>) {
  if (!selectedCardIds.has(draggedCardId)) return [draggedCardId]
  return Array.from(selectedCardIds)
}
