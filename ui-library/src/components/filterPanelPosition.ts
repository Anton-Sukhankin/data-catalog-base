export function filterValueListHeight(count: number, showSearch: boolean) {
  return (showSearch ? 56 : 0) + Math.min(276, Math.max(0, count * 40 - 4)) + 12;
}

export function placePanelValueList(anchor: { left: number; right?: number; top: number; bottom: number }, width: number, height: number, viewport: { width: number; height: number }, alignment: 'start' | 'end' = 'start') {
  const below = anchor.bottom + 8;
  const top = below + height <= viewport.height ? below : anchor.top - height - 8;
  const left = alignment === 'end' && anchor.right !== undefined ? anchor.right - width : anchor.left;
  return {
    left: Math.max(0, Math.min(left, viewport.width - width)),
    top: Math.max(0, Math.min(top, viewport.height - height)),
  };
}
