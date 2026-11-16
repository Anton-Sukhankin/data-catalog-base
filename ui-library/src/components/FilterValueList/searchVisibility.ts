/** Count the complete option set, never the remaining search results. */
export function shouldShowFilterSearch(totalOptionsCount: number, selectionMode: 'multiple' | 'single' = 'multiple', requested = true) {
  return requested && (selectionMode === 'single' || totalOptionsCount >= 7);
}
