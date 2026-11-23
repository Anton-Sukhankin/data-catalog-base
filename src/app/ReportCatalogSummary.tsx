import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { Tooltip } from 'radix-ui';
import type { ReportTableRow } from '@data-catalog/ui/source/data/reportTable';
import styles from './ReportCatalogSummary.module.css';

const domainColors = ['#0067d8', '#408fe7', '#649fdf', '#8ebbec', '#a7caed', '#c3dcf6']
  .map((light, index) => 'var(--catalog-theme-chart-domain-' + (index + 1) + ', ' + light + ')');
const countFormat = new Intl.NumberFormat('ru');
const summaryMotionDuration = 180;
const scrollAccelerationDuration = 45;
const scrollResponseTime = 45;

function Statistic({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return <div className={styles.card}>
    <div className={styles.metric}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
    {children}
  </div>;
}

export function ReportCatalogSummary({ domains, workspace }: {
  domains: ReadonlyMap<string, readonly ReportTableRow[]>;
  workspace: RefObject<HTMLElement | null>;
}) {
  const summary = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = summary.current;
    const root = workspace.current;
    if (!element || !root) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let height = 0;
    let hidden = 0;
    let target = 0;
    let frame = 0;
    let motionStart = 0;
    let motionDuration = summaryMotionDuration;
    let startHidden = 0;
    let pendingScroll: { viewport: HTMLElement; delta: number } | undefined;
    let scrollFrame = 0;
    let scrollMotion: {
      viewport: HTMLElement;
      position: number;
      target: number;
      startedAt: number;
      lastFrameAt: number;
    } | undefined;

    const paint = (next: number) => {
      hidden = next;
      const visible = height - hidden;
      root.style.setProperty('--report-summary-visible', `${visible}px`);
      element.style.setProperty('--summary-shadow-opacity', String(height ? visible / height : 0));
      element.inert = hidden === height;
    };

    const stopScroll = () => {
      cancelAnimationFrame(scrollFrame);
      scrollMotion = undefined;
    };

    const tickScroll = (now: number) => {
      const motion = scrollMotion;
      if (!motion || !root.contains(motion.viewport)) {
        stopScroll();
        return;
      }
      const elapsed = Math.min(32, Math.max(0, now - motion.lastFrameAt));
      const acceleration = Math.min(1, Math.max(0, now - motion.startedAt) / scrollAccelerationDuration);
      const fraction = acceleration * (1 - Math.exp(-elapsed / scrollResponseTime));
      motion.lastFrameAt = now;
      motion.position += (motion.target - motion.position) * fraction;
      if (Math.abs(motion.target - motion.position) < 0.5) {
        motion.viewport.scrollTop = motion.target;
        stopScroll();
        return;
      }
      motion.viewport.scrollTop = motion.position;
      scrollFrame = requestAnimationFrame(tickScroll);
    };

    const scrollRemainder = (viewport: HTMLElement, delta: number) => {
      if (!root.contains(viewport)) return;
      if (reducedMotion.matches) {
        viewport.scrollBy(0, delta);
        return;
      }
      const position = viewport.scrollTop;
      const end = (scrollMotion?.target ?? position) + delta;
      const destination = Math.max(0, Math.min(end, viewport.scrollHeight - viewport.clientHeight));
      if (scrollMotion) {
        scrollMotion.target = destination;
      } else if (destination !== position) {
        // Start the list on the same frame as the end of the summary, with a small first step.
        const distance = Math.abs(destination - position);
        const firstStep = Math.min(distance, Math.max(1, distance * 0.035), 6);
        const firstPosition = position + Math.sign(destination - position) * firstStep;
        viewport.scrollTop = firstPosition;
        if (firstStep === distance) return;
        const now = performance.now();
        scrollMotion = { viewport, position: firstPosition, target: destination, startedAt: now, lastFrameAt: now };
        scrollFrame = requestAnimationFrame(tickScroll);
      }
    };

    const finish = () => {
      frame = 0;
      paint(target);
      const scroll = pendingScroll;
      pendingScroll = undefined;
      if (scroll) scrollRemainder(scroll.viewport, scroll.delta);
    };

    function tick(now: number) {
      const progress = Math.min(1, Math.max(0, (now - motionStart) / motionDuration));
      const eased = 1 - (1 - progress) ** 3;
      const next = startHidden + (target - startHidden) * eased;
      if (Math.abs(target - next) < 0.75) {
        finish();
        return;
      }
      paint(next);
      frame = requestAnimationFrame(tick);
    }

    const animate = () => {
      cancelAnimationFrame(frame);
      if (hidden === target || reducedMotion.matches) {
        finish();
        return;
      }
      startHidden = hidden;
      motionStart = performance.now();
      motionDuration = Math.max(60, summaryMotionDuration * Math.abs(target - hidden) / height);
      frame = requestAnimationFrame(tick);
    };

    const measure = () => {
      const nextHeight = element.offsetHeight;
      if (nextHeight === height) return;
      const hiddenFraction = height ? hidden / height : 0;
      target = height ? target / height * nextHeight : 0;
      height = nextHeight;
      paint(hiddenFraction * height);
      if (frame) animate();
    };

    const getViewport = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const viewport = event.target.closest<HTMLElement>('[data-list-scroll]');
      if (viewport?.closest('[data-report-summary-results]') && root.contains(viewport)) return viewport;
    };

    function consume(delta: number, viewport: HTMLElement, event: Event) {
      if (!event.cancelable || delta === 0) return;
      if (scrollMotion) {
        if (scrollMotion.viewport === viewport && (scrollMotion.target - scrollMotion.position) * delta > 0) {
          event.preventDefault();
          scrollRemainder(viewport, delta);
          return;
        }
        stopScroll();
      }
      if (!frame && (delta > 0 ? hidden >= height : hidden <= 0)) return;
      event.preventDefault();
      // A reversal starts from the position on screen and drops scroll from the previous direction.
      if ((target - hidden) * delta < 0) {
        target = hidden;
        pendingScroll = undefined;
      }
      const previous = target;
      target = Math.min(height, Math.max(0, previous + delta));
      const remaining = delta - (target - previous);
      if (remaining) {
        const queued = pendingScroll?.viewport === viewport ? pendingScroll.delta : 0;
        pendingScroll = { viewport, delta: queued + remaining };
      }
      if (!frame || target !== previous || hidden === target) animate();
    }

    const onWheel = (event: WheelEvent) => {
      const mode = event.deltaMode;
      if (event.defaultPrevented || event.ctrlKey || event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      let viewport = getViewport(event);
      if (!viewport && event.target instanceof Element) {
        const content = event.target.closest('[data-report-summary-results]');
        const overMovingControls = (Boolean(frame) || (event.deltaY < 0 && hidden > 0))
          && event.target.closest('[data-home-controls], [data-report-summary-clip]')
          && !event.target.closest('[data-control-group="tabs"]');
        viewport = (content ?? (overMovingControls ? root.querySelector('[data-report-summary-results]') : null))
          ?.querySelector<HTMLElement>('[data-list-scroll]') ?? undefined;
      }
      if (!viewport) return;
      const lineScale = mode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
      const pageMode = mode === WheelEvent.DOM_DELTA_PAGE;
      consume(event.deltaY * (pageMode ? viewport.clientHeight : lineScale), viewport, event);
      // Canceling vertical wheel scrolling also cancels the browser's horizontal movement.
      if (event.defaultPrevented && event.deltaX) {
        viewport.scrollLeft += event.deltaX * (pageMode ? viewport.clientWidth : lineScale);
      }
    };

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const viewport = getViewport(event);
      if (!viewport) return;
      switch (event.key) {
        case 'ArrowDown': consume(40, viewport, event); break;
        case 'ArrowUp': consume(-40, viewport, event); break;
        case 'PageDown': consume(viewport.clientHeight, viewport, event); break;
        case 'PageUp': consume(-viewport.clientHeight, viewport, event); break;
      }
    }

    const showOnFocus = () => {
      if (hidden === 0 && target === 0) return;
      stopScroll();
      pendingScroll = undefined;
      target = 0;
      animate();
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('keydown', onKeyDown);
    element.addEventListener('focusin', showOnFocus);
    return () => {
      cancelAnimationFrame(frame);
      stopScroll();
      resize.disconnect();
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('keydown', onKeyDown);
      element.removeEventListener('focusin', showOnFocus);
      root.style.removeProperty('--report-summary-visible');
    };
  }, [workspace]);

  let total = 0;
  let verified = 0;
  for (const reports of domains.values()) {
    total += reports.length;
    for (const { report } of reports) {
      if (report.verification?.status === 'verified') verified += 1;
    }
  }
  const distribution = Array.from(domains, ([name, reports]) => ({ name, count: reports.length }))
    .sort((left, right) => right.count - left.count)
    .map((domain, index) => ({ ...domain, color: domainColors[index % domainColors.length] }));
  const share = total ? verified / total * 100 : 0;

  return <div className={styles.slot} data-report-summary-clip>
    <div ref={summary} className={styles.inset}>
      <section className={styles.summary} aria-label="Сводка каталога отчётов">
      <dl className={styles.cards}>
        <Statistic label="Всего отчётов" value={countFormat.format(total)} />
        <Statistic label="Домены" value={countFormat.format(domains.size)}>
          <div className={styles.chart}>
            <span className={styles.caption}>Отчёты по доменам</span>
            {distribution.length ? <Tooltip.Provider delayDuration={350} disableHoverableContent>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <span className={styles.distribution} role="img" tabIndex={0} aria-label="Распределение отчётов по доменам">
                    {distribution.map(({ name, count, color }) => <span key={name} aria-hidden="true"
                      style={{ flexGrow: count, backgroundColor: color }} />)}
                  </span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className={styles.tooltip} side="bottom" align="end" sideOffset={6} collisionPadding={8}
                    data-report-domain-breakdown>
                    <ul className={styles.legend}>
                      {distribution.map(({ name, count, color }) => <li key={name}>
                        <span className={styles.key} style={{ backgroundColor: color }} aria-hidden="true" />
                        <span>{name}</span>
                        <strong>{countFormat.format(count)}</strong>
                      </li>)}
                    </ul>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider> : <span className={styles.track} aria-hidden="true" />}
          </div>
        </Statistic>
        <Statistic label="Проверенные" value={`${countFormat.format(verified)} из ${countFormat.format(total)}`}>
          <div className={styles.chart}>
            <span className={styles.caption}>{total ? `${Math.round(share)}%` : '—'}</span>
            <span className={styles.track} aria-hidden="true"><span style={{ width: `${share}%` }} /></span>
          </div>
        </Statistic>
      </dl>
      </section>
    </div>
  </div>;
}
