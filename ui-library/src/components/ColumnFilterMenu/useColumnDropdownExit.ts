import { useEffect, useState } from 'react';
import type { AnimationEvent } from 'react';

/** Retains the last rendered menu while its non-interactive surface fades out. */
export function useColumnDropdownExit<T>() {
  const [exiting, setExiting] = useState<T>();

  useEffect(() => {
    if (!exiting) return;
    // Release the snapshot even if the browser cancels the animation.
    const timeout = window.setTimeout(() => setExiting(undefined), 260);
    return () => window.clearTimeout(timeout);
  }, [exiting]);

  function startExit(snapshot: T) {
    setExiting(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? undefined : snapshot);
  }

  function clearExit() { setExiting(undefined); }

  function onExitAnimationEnd(event: AnimationEvent<HTMLElement>) {
    if (event.target === event.currentTarget && event.animationName === 'catalog-column-dropdown-exit') clearExit();
  }

  return { exiting, startExit, clearExit, onExitAnimationEnd };
}
