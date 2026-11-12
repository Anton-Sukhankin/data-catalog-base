import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

type Edge = 'top' | 'bottom';
type Gesture = Edge | 'move';
type Bounds = { top: number; right: number; height: number };

const headerHeight = 48;
const minimumHeight = 240;
const keyboardStep = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sameBounds(a: Bounds, b: Bounds) {
  return a.top === b.top && a.right === b.right && a.height === b.height;
}

export function useAssistantPanelPlacement(viewportWidth: number, viewportHeight: number, expanded: boolean) {
  const [placement, setPlacement] = useState<Bounds>();
  const [gesture, setGesture] = useState<Gesture>();
  const pointer = useRef<{ id: number; kind: Gesture; x: number; y: number; bounds: Bounds }>(null);

  const inset = viewportWidth <= 540 ? 12 : 24;
  const topLimit = headerHeight + inset;
  const bottomLimit = Math.max(topLimit, viewportHeight - inset);
  const maxHeight = bottomLimit - topLimit;
  const minHeight = Math.min(minimumHeight, maxHeight);
  const maxRight = Math.max(inset, viewportWidth - 730 - inset);

  function fit(bounds: Bounds): Bounds {
    const height = clamp(bounds.height, minHeight, maxHeight);
    return {
      top: clamp(bounds.top, topLimit, bottomLimit - height),
      right: clamp(bounds.right, inset, maxRight),
      height,
    };
  }

  const defaultBounds = { top: topLimit, right: inset, height: maxHeight };
  const bounds = placement ? fit(placement) : defaultBounds;
  const customized = !sameBounds(bounds, defaultBounds);

  function updateBounds(requested: Bounds) {
    const next = fit(requested);
    setPlacement(sameBounds(next, defaultBounds) ? undefined : next);
  }

  function resetBounds() {
    pointer.current = null;
    setGesture(undefined);
    setPlacement(undefined);
  }

  function halveHeight() {
    const height = Math.max(minHeight, Math.round(bounds.height / 2));
    updateBounds({ ...bounds, top: bottomLimit - height, height });
  }

  function heightLimit(edge: Edge, start = bounds) {
    return edge === 'top' ? start.top + start.height - topLimit : bottomLimit - start.top;
  }

  function resize(edge: Edge, requestedHeight: number, start: Bounds) {
    const height = clamp(requestedHeight, minHeight, heightLimit(edge, start));
    updateBounds({ ...start, top: edge === 'top' ? start.top + start.height - height : start.top, height });
  }

  function move(start: Bounds, dx: number, dy: number) {
    updateBounds({ ...start, top: start.top + dy, right: start.right - dx });
  }

  function startGesture(event: PointerEvent<HTMLElement>, kind: Gesture) {
    if (expanded || event.button !== 0 || pointer.current) return;
    if (kind === 'move' && event.target instanceof Element && event.target.closest('button')) return;
    // Start from the visible panel if the pointer interrupts a height transition.
    const panel = event.currentTarget.closest('[data-assistant-expanded]');
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const visible = fit({ top: Math.round(rect.top), right: Math.round(viewportWidth - rect.right), height: Math.round(rect.height) });
    pointer.current = {
      id: event.pointerId, kind, x: event.clientX, y: event.clientY,
      bounds: visible,
    };
    if (!sameBounds(visible, bounds)) updateBounds(visible);
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setGesture(kind);
  }

  function movePointer(event: PointerEvent<HTMLElement>) {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    const dy = event.clientY - start.y;
    if (start.kind === 'move') move(start.bounds, event.clientX - start.x, dy);
    else resize(start.kind, start.bounds.height + (start.kind === 'top' ? -dy : dy), start.bounds);
  }

  function stopGesture(event: PointerEvent<HTMLElement>) {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    setGesture(undefined);
  }

  function resizeKey(event: KeyboardEvent<HTMLElement>, edge: Edge) {
    const step = edge === 'top' ? -keyboardStep : keyboardStep;
    const height = event.key === 'Home' ? minHeight : event.key === 'End' ? heightLimit(edge) :
      event.key === 'ArrowDown' ? bounds.height + step : event.key === 'ArrowUp' ? bounds.height - step : undefined;
    if (height === undefined) return;
    event.preventDefault();
    resize(edge, height, bounds);
  }

  function moveKey(event: KeyboardEvent<HTMLElement>) {
    if (expanded || event.target !== event.currentTarget) return;
    const dx = event.key === 'ArrowLeft' ? -keyboardStep : event.key === 'ArrowRight' ? keyboardStep : 0;
    const dy = event.key === 'ArrowUp' ? -keyboardStep : event.key === 'ArrowDown' ? keyboardStep : 0;
    if (!dx && !dy) return;
    event.preventDefault();
    move(bounds, dx, dy);
  }

  const pointerHandlers = {
    onPointerMove: movePointer, onPointerUp: stopGesture,
    onPointerCancel: stopGesture, onLostPointerCapture: stopGesture,
  };

  return {
    bounds, customized, minHeight, maxHeight, gesture, heightLimit, halveHeight, resetBounds, startGesture,
    pointerHandlers, resizeKey, moveKey,
    style: !expanded && customized ? { top: bounds.top, right: bounds.right, bottom: viewportHeight - bounds.top - bounds.height } : undefined,
  };
}
