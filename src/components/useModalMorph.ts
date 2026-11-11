import { useEffectEvent, useLayoutEffect, useRef, type RefObject } from 'react';

const duration = 300;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useModalMorph({ opener, backdrop, reveal, panel, closing, onExitComplete }: {
  opener?: HTMLElement | null;
  backdrop: RefObject<HTMLElement | null>;
  reveal: RefObject<HTMLElement | null>;
  panel: RefObject<HTMLElement | null>;
  closing: boolean;
  onExitComplete?: () => void;
}) {
  const motion = useRef<{ animations: Animation[]; maskFrames: () => Keyframe[] }>(null);
  const finishExit = useEffectEvent(() => onExitComplete?.());

  useLayoutEffect(() => {
    const dimmer = backdrop.current;
    const surface = reveal.current;
    const content = panel.current;
    if (!opener?.isConnected || !dimmer || !surface || !content || reduceMotion()) return;
    const from = opener.getBoundingClientRect();
    const to = content.getBoundingClientRect();
    if (!from.width || !from.height || !to.width || !to.height) return;

    // Animate a viewport-sized mask so the panel and controls keep their final geometry.
    const maskFrames = () => {
      const origin = opener.getBoundingClientRect();
      const destination = content.getBoundingClientRect();
      const bounds = surface.getBoundingClientRect();
      const { backgroundColor, borderTopLeftRadius } = getComputedStyle(content);
      const clip = (box: DOMRect, radius: string) => `inset(${box.top - bounds.top}px ${bounds.right - box.right}px ${bounds.bottom - box.bottom}px ${box.left - bounds.left}px round ${radius})`;
      return [
        { clipPath: clip(origin, `${Math.min(origin.width, origin.height) / 2}px`), backgroundColor },
        { clipPath: clip(destination, borderTopLeftRadius), backgroundColor },
      ];
    };

    const timing = { duration, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' } satisfies KeyframeAnimationOptions;
    const mask = surface.animate(maskFrames(), timing);
    const animations = [
      mask,
      dimmer.animate([{ opacity: 0 }, { opacity: 1 }], timing),
      content.animate([{ opacity: 0 }, { opacity: 0, offset: 0.57 }, { opacity: 1 }], { ...timing, easing: 'linear' }),
    ];
    motion.current = { animations, maskFrames };
    return () => {
      animations.forEach(animation => animation.cancel());
      motion.current = null;
    };
  }, [opener, backdrop, reveal, panel]);

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
      const [mask] = current.animations;
      if (mask?.effect instanceof KeyframeEffect && Number(mask.currentTime) >= duration) {
        mask.effect.setKeyframes(current.maskFrames());
      }
      // Reverse from the current frame when dismissal interrupts opening.
      for (const animation of animations) {
        animation.effect?.updateTiming({ fill: 'both' });
        animation.reverse();
        animation.updatePlaybackRate(-1.4);
      }
      void Promise.allSettled(animations.map(animation => animation.finished)).then(completeExit);
    } catch {
      completeExit();
    }
    return () => {
      active = false;
      window.clearTimeout(deadline);
    };
  }, [closing, opener]);
}
