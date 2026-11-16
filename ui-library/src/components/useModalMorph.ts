import { useEffectEvent, useLayoutEffect, useRef, type RefObject } from 'react';

const duration = 300;
const exitPlaybackRate = 1.4;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useModalMorph({ opener, backdrop, reveal, panel, closing, onExitComplete, scalePanel }: {
  opener?: HTMLElement | null;
  backdrop?: RefObject<HTMLElement | null>;
  reveal: RefObject<HTMLElement | null>;
  panel: RefObject<HTMLElement | null>;
  closing: boolean;
  onExitComplete?: () => void;
  scalePanel?: boolean;
}) {
  const motion = useRef<{ animations: Animation[]; geometryFrames: () => Keyframe[] }>(null);
  const finishExit = useEffectEvent(() => onExitComplete?.());

  useLayoutEffect(() => {
    const dimmer = backdrop?.current;
    const surface = reveal.current;
    const content = panel.current;
    if (!opener?.isConnected || !surface || !content || (backdrop && !dimmer) || reduceMotion()) return;
    const from = opener.getBoundingClientRect();
    const to = content.getBoundingClientRect();
    if (!from.width || !from.height || !to.width || !to.height) return;

    const geometryFrames = () => {
      const origin = opener.getBoundingClientRect();
      const destination = content.getBoundingClientRect();
      const { backgroundColor, borderTopLeftRadius } = getComputedStyle(content);
      if (scalePanel) {
        const scaleX = origin.width / destination.width;
        const scaleY = origin.height / destination.height;
        const originRadius = Number.parseFloat(getComputedStyle(opener).borderTopLeftRadius);
        const destinationRadius = Number.parseFloat(borderTopLeftRadius);
        return [0, 0.025, 0.06, 0.12, 0.22, 0.4, 0.65, 1].map(offset => {
          const remaining = 1 - offset;
          const x = scaleX * remaining + offset;
          const y = scaleY * remaining + offset;
          // Compensate for the scale so the visible corners stay close to the panel and button radii.
          const radius = originRadius * remaining + destinationRadius * offset;
          return {
            offset,
            transformOrigin: '0 0',
            transform: `translate(${(origin.left - destination.left) * remaining}px, ${(origin.top - destination.top) * remaining}px) scale(${x}, ${y})`,
            borderRadius: `${radius / x}px / ${radius / y}px`,
          };
        });
      }

      // The mask variant keeps the panel and controls at their final size.
      const bounds = surface.getBoundingClientRect();
      const originRadius = `${Math.min(origin.width, origin.height) / 2}px`;
      const clip = (box: DOMRect, radius: string) => `inset(${box.top - bounds.top}px ${bounds.right - box.right}px ${bounds.bottom - box.bottom}px ${box.left - bounds.left}px round ${radius})`;
      return [
        { clipPath: clip(origin, originRadius), backgroundColor },
        { clipPath: clip(destination, borderTopLeftRadius), backgroundColor },
      ];
    };

    const timing = { duration, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' } satisfies KeyframeAnimationOptions;
    const geometry = (scalePanel ? content : surface).animate(geometryFrames(), timing);
    const animations = [
      geometry,
      ...(dimmer ? [dimmer.animate([{ opacity: 0 }, { opacity: 1 }], timing)] : []),
    ];
    if (!scalePanel) {
      animations.push(content.animate([{ opacity: 0 }, { opacity: 0, offset: 0.57 }, { opacity: 1 }], { ...timing, easing: 'linear' }));
    }
    motion.current = { animations, geometryFrames };
    return () => {
      animations.forEach(animation => animation.cancel());
      motion.current = null;
    };
  }, [opener, backdrop, reveal, panel, scalePanel]);

  useLayoutEffect(() => {
    if (!closing) return;
    const current = motion.current;
    const animations = current?.animations.filter(animation => Number(animation.currentTime) > 0);
    if (!current || !animations?.length || !opener?.isConnected || reduceMotion()) {
      finishExit();
      return;
    }
    let active = true;
    // A stalled animation must release the page and restore focus.
    const deadline = window.setTimeout(completeExit, duration * 2);
    function completeExit() {
      if (!active) return;
      active = false;
      window.clearTimeout(deadline);
      finishExit();
    }
    try {
      // The panel can change size after opening, for example when adding attachments.
      const [geometry] = current.animations;
      if (geometry?.effect instanceof KeyframeEffect && Number(geometry.currentTime) >= duration) {
        if (scalePanel) geometry.effect.updateTiming({ fill: 'none' });
        geometry.effect.setKeyframes(current.geometryFrames());
      }
      // Reverse from the current frame when dismissal interrupts opening.
      for (const animation of animations) {
        animation.effect?.updateTiming({ fill: 'both' });
        animation.reverse();
        animation.updatePlaybackRate(-exitPlaybackRate);
      }
      void Promise.allSettled(animations.map(animation => animation.finished)).then(completeExit);
    } catch {
      completeExit();
    }
    return () => {
      active = false;
      window.clearTimeout(deadline);
    };
  }, [closing, opener, scalePanel]);
}
