export interface Point { x: number; y: number }
export interface Bounds extends Point { width: number; height: number }

export const defaultScene: Bounds = { x: 0, y: 0, width: 1070, height: 500 };
export const defaultReportPosition: Point = { x: 325, y: 88 };

/** Child's top port to parent's bottom port, with outward-facing tangents. */
export function lineagePath(child: Point, parent: Point): string {
  const bend = Math.max(32, Math.min(160, Math.abs(child.y - parent.y) / 2));
  const spread = Math.sign(child.x - parent.x) * Math.min(60, Math.abs(child.x - parent.x) / 3);
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
