import type { ProviderOption } from './registry'

export interface RemoveProviderResult {
  providers: ProviderOption[]
  selectedId: string
}

/**
 * Remove a provider from the list by id.
 *
 * - If the list has only one item, returns it unchanged (last-provider guard).
 * - If the removed provider was the current selection, falls back to the first remaining.
 * - Otherwise, keeps the current selection.
 */
export function removeProvider(
  providers: ProviderOption[],
  idToRemove: string,
  currentSelectedId: string,
): RemoveProviderResult {
  if (providers.length <= 1) {
    return { providers, selectedId: currentSelectedId }
  }

  const updated = providers.filter(p => p.id !== idToRemove)
  const stillSelected = updated.some(p => p.id === currentSelectedId)
  const selectedId = stillSelected ? currentSelectedId : (updated[0]?.id ?? '')

  return { providers: updated, selectedId }
}
