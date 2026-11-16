export interface Point { x: number; y: number }
export interface Bounds extends Point { width: number; height: number }

export const defaultScene: Bounds = { x: 0, y: 0, width: 800, height: 500 };
export const lineageNodeSize = { width: 230, height: 52 };
export const defaultReportPosition: Point = { x: (defaultScene.width - lineageNodeSize.width) / 2, y: 88 };

export function lineageRow(ids: readonly string[]) {
  const step = lineageNodeSize.width + 26;
  const firstX = defaultReportPosition.x - (ids.length - 1) * step / 2;
  return ids.map((sourceId, index) => ({ sourceId, x: firstX + index * step, y: 272 }));
}

/** Child's top port to parent's bottom port, with outward-facing tangents. */
export function lineagePath(child: Point, parent: Point): string {
  const bend = Math.max(32, Math.min(160, Math.abs(child.y - parent.y) / 2));
  const spread = Math.sign(child.x - parent.x) * Math.min(36, Math.abs(child.x - parent.x) / 5);
  return `M${child.x} ${child.y} C${child.x} ${child.y - bend} ${parent.x + spread} ${parent.y + bend} ${parent.x} ${parent.y}`;
}

/** Keep the initial framing, expanding it only for nodes moved beyond it. */
export function fitLineageBounds(nodes: readonly Bounds[]): Bounds {
  const left = Math.min(0, ...nodes.map(node => node.x - 24));
  const top = Math.min(0, ...nodes.map(node => node.y - 24));
  const right = Math.max(defaultScene.width, ...nodes.map(node => node.x + node.width + 24));
  const bottom = Math.max(defaultScene.height, ...nodes.map(node => node.y + node.height + 24));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
