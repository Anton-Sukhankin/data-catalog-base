import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

type VerticalEdge = 'top' | 'bottom';
type Gesture = VerticalEdge | 'left' | 'top-left' | 'move';
type Bounds = { top: number; right: number; height: number; width: number };
type Placement = Omit<Bounds, 'width'> & { width?: number };

const headerHeight = 48;
const minimumHeight = 240;
const minimumWidth = 520;
const defaultPanelWidth = 730;
const keyboardStep = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sameBounds(a: Bounds, b: Bounds) {
  return a.top === b.top && a.right === b.right && a.height === b.height && a.width === b.width;
}

export function useAssistantPanelPlacement(viewportWidth: number, viewportHeight: number, expanded: boolean) {
  const [placement, setPlacement] = useState<Placement>();
  const [gesture, setGesture] = useState<Gesture>();
  const pointer = useRef<{ id: number; kind: Gesture; x: number; y: number; bounds: Bounds }>(null);

  const inset = viewportWidth <= 540 ? 12 : 24;
  const topLimit = headerHeight + inset;
  const bottomLimit = Math.max(topLimit, viewportHeight - inset);
  const maxHeight = bottomLimit - topLimit;
  const minHeight = Math.min(minimumHeight, maxHeight);
  const availableWidth = Math.max(0, viewportWidth - 2 * inset);
  const minWidth = Math.min(minimumWidth, availableWidth);
  const defaultWidth = Math.min(defaultPanelWidth, availableWidth);

  function fit(bounds: Bounds): Bounds {
    const height = clamp(bounds.height, minHeight, maxHeight);
    const width = clamp(bounds.width, minWidth, availableWidth);
    return {
      top: clamp(bounds.top, topLimit, bottomLimit - height),
      right: clamp(bounds.right, inset, viewportWidth - width - inset),
      height,
      width,
    };
  }

  const defaultBounds = { top: topLimit, right: inset, height: maxHeight, width: defaultWidth };
  const bounds = placement ? fit({ ...placement, width: placement.width ?? defaultWidth }) : defaultBounds;
  const customized = placement?.width !== undefined || !sameBounds(bounds, defaultBounds);

  function updateBounds(requested: Bounds, widthOverride: number | undefined) {
    const next = fit(requested);
    setPlacement(sameBounds(next, defaultBounds) && widthOverride === undefined
      ? undefined : { ...next, width: widthOverride });
  }

  function resetBounds() {
    pointer.current = null;
    setGesture(undefined);
    setPlacement(undefined);
  }

  function halveHeight() {
    const height = Math.max(minHeight, Math.round(bounds.height / 2));
    updateBounds({ ...bounds, top: bottomLimit - height, height }, placement?.width);
  }

  function heightLimit(edge: VerticalEdge, start = bounds) {
    return edge === 'top' ? start.top + start.height - topLimit : bottomLimit - start.top;
  }

  function resizeHeight(edge: VerticalEdge, requestedHeight: number, start: Bounds) {
    const height = clamp(requestedHeight, minHeight, heightLimit(edge, start));
    updateBounds({ ...start, top: edge === 'top' ? start.top + start.height - height : start.top, height }, placement?.width);
  }

  function widthLimit(start = bounds) {
    return viewportWidth - start.right - inset;
  }

  function resizeWidth(requestedWidth: number, start: Bounds) {
    const width = clamp(requestedWidth, minWidth, widthLimit(start));
    updateBounds({ ...start, width }, width === defaultWidth ? undefined : width);
  }

  function move(start: Bounds, dx: number, dy: number) {
    updateBounds({ ...start, top: start.top + dy, right: start.right - dx }, placement?.width);
  }

  function startGesture(event: PointerEvent<HTMLElement>, kind: Gesture) {
    if (expanded || event.button !== 0 || pointer.current) return;
    if (kind === 'move' && event.target instanceof Element && event.target.closest('button')) return;
    // Start from the visible panel if the pointer interrupts a size transition.
    const panel = event.currentTarget.closest('[data-assistant-expanded]');
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const visible = fit({
      top: Math.round(rect.top), right: Math.round(viewportWidth - rect.right),
      height: Math.round(rect.height), width: Math.round(rect.width),
    });
    pointer.current = {
      id: event.pointerId, kind, x: event.clientX, y: event.clientY,
      bounds: visible,
    };
    if (!sameBounds(visible, bounds)) {
      updateBounds(visible, visible.width === bounds.width ? placement?.width : visible.width);
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setGesture(kind);
  }

  function movePointer(event: PointerEvent<HTMLElement>) {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (start.kind === 'move') move(start.bounds, dx, dy);
    else if (start.kind === 'left') resizeWidth(start.bounds.width - dx, start.bounds);
    else if (start.kind === 'top-left') {
      const width = clamp(start.bounds.width - dx, minWidth, widthLimit(start.bounds));
      const height = clamp(start.bounds.height - dy, minHeight, heightLimit('top', start.bounds));
      const top = start.bounds.top + start.bounds.height - height;
      updateBounds({ ...start.bounds, top, width, height }, width === defaultWidth ? undefined : width);
    }
    else resizeHeight(start.kind, start.bounds.height + (start.kind === 'top' ? -dy : dy), start.bounds);
  }

  function stopGesture(event: PointerEvent<HTMLElement>) {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    setGesture(undefined);
  }

  function resizeKey(event: KeyboardEvent<HTMLElement>, edge: VerticalEdge) {
    const step = edge === 'top' ? -keyboardStep : keyboardStep;
    const height = event.key === 'Home' ? minHeight : event.key === 'End' ? heightLimit(edge) :
      event.key === 'ArrowDown' ? bounds.height + step : event.key === 'ArrowUp' ? bounds.height - step : undefined;
    if (height === undefined) return;
    event.preventDefault();
    resizeHeight(edge, height, bounds);
  }

  function resizeWidthKey(event: KeyboardEvent<HTMLElement>) {
    const width = event.key === 'Home' ? minWidth : event.key === 'End' ? widthLimit() :
      event.key === 'ArrowLeft' ? bounds.width + keyboardStep : event.key === 'ArrowRight' ? bounds.width - keyboardStep : undefined;
    if (width === undefined) return;
    event.preventDefault();
    resizeWidth(width, bounds);
  }

  function resizeCornerKey(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') resizeWidthKey(event);
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') resizeKey(event, 'top');
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
    bounds, customized, minHeight, maxHeight, minWidth, maxWidth: widthLimit(), gesture, heightLimit,
    halveHeight, resetBounds, startGesture, pointerHandlers, resizeKey, resizeWidthKey, resizeCornerKey, moveKey,
    style: !expanded && customized ? {
      top: bounds.top, right: bounds.right, bottom: viewportHeight - bounds.top - bounds.height, width: bounds.width,
    } : undefined,
  };
}
