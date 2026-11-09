import { useId, useState } from 'react';
import { EmptyDetail } from '../EmptyDetail';
import { formatUsageNumber, usageChartDomain, usageMetrics } from './model';
import type { UsageMetric, UsageMonth } from './model';
import s from './Usage.module.css';

const chartNumber = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const chartWidth = 1038;

export function UsageChart({ months, metric }: { months: readonly UsageMonth[]; metric: UsageMetric }) {
  const tooltipId = useId();
  const [activeIndex, setActiveIndex] = useState<number>();
  const label = usageMetrics.find(item => item.id === metric)!.label;
  const values = months.map(month => month[metric]);
  if (!months.length || values.some(value => value === undefined)) return <div className={s.chartEmpty}><EmptyDetail title="Нет помесячных данных" description={`Помесячная история показателя «${label}» не предоставлена.`} /></div>;
  const numbers = values as number[];
  const maximum = usageChartDomain(metric, numbers);
  const points = numbers.map((value, index) => ({ x: months.length === 1 ? 519 : 36 + index * 966 / (months.length - 1), y: 316 - value / maximum * 300 }));
  // Monotone cubic interpolation keeps extrema and plateaus within the observed
  // monthly values rather than inventing peaks between the markers.
  const slopes = points.slice(1).map((point, index) => (point.y - points[index].y) / (point.x - points[index].x));
  const tangents = points.map((_, index) => {
    if (!index) return slopes[0] ?? 0;
    if (index === points.length - 1) return slopes.at(-1) ?? 0;
    const before = slopes[index - 1];
    const after = slopes[index];
    return before * after <= 0 ? 0 : 2 * before * after / (before + after);
  });
  const path = points.map((point, index) => {
    if (!index) return `M${point.x},${point.y}`;
    const previous = points[index - 1];
    const third = (point.x - previous.x) / 3;
    return `C${previous.x + third},${previous.y + third * tangents[index - 1]} ${point.x - third},${point.y - third * tangents[index]} ${point.x},${point.y}`;
  }).join(' ');
  const format = (value: number) => `${chartNumber.format(value)}${metric === 'regularity' ? '%' : ''}`;
  const activePoint = activeIndex === undefined ? undefined : points[activeIndex];
  return <div className={s.chart} data-usage-chart={metric}>
    <div className={s.axis} aria-hidden="true">{[4, 3, 2, 1, 0].map(tick => <span key={tick}>{format(maximum * tick / 4)}</span>)}</div>
    <div className={s.plot}>
      <svg viewBox={`0 0 ${chartWidth} 328`} preserveAspectRatio="none" role="img" aria-label={`${label}: ${months[0].label} — ${months.at(-1)!.label}`}
        tabIndex={0} aria-describedby={activePoint ? tooltipId : undefined}
        onPointerLeave={() => setActiveIndex(undefined)}
        onFocus={() => setActiveIndex(index => index ?? 0)} onBlur={() => setActiveIndex(undefined)}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            setActiveIndex(undefined);
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            const step = event.key === 'ArrowRight' ? 1 : -1;
            setActiveIndex(index => index === undefined ? 0 : Math.max(0, Math.min(points.length - 1, index + step)));
          }
        }}>
        {[0, 1, 2, 3, 4].map(tick => <line key={tick} x1="0" x2="1038" y1={16 + tick * 75} y2={16 + tick * 75} className={s.gridLine} />)}
        {points.map((point, index) => <line key={index} x1={point.x} x2={point.x} y1="16" y2="316" className={s.gridLine} strokeDasharray="3 4" />)}
        {activePoint && <line x1="0" x2="0" y1="16" y2="316" className={s.guide}
          vectorEffect="non-scaling-stroke" style={{ transform: `translateX(${activePoint.x}px)` }} data-usage-guide />}
        <path d={path} className={s.chartLine} vectorEffect="non-scaling-stroke" />
        {points.map((point, index) => <circle key={months[index].id} cx={point.x} cy={point.y} r="4" className={s.marker} vectorEffect="non-scaling-stroke" />)}
        {points.map((point, index) => {
          const left = index === 0 ? 0 : (points[index - 1].x + point.x) / 2;
          const right = index === points.length - 1 ? chartWidth : (point.x + points[index + 1].x) / 2;
          return <rect key={months[index].id} x={left} width={right - left} y="16" height="300" fill="transparent"
            aria-hidden="true" data-usage-month={months[index].id} onPointerEnter={() => setActiveIndex(index)} />;
        })}
      </svg>
      {activePoint && activeIndex !== undefined && <div id={tooltipId} role="tooltip" className={s.chartTooltip}
        style={{ left: `clamp(72px, ${activePoint.x / chartWidth * 100}%, calc(100% - 72px))`, top: activePoint.y < 68 ? activePoint.y + 12 : activePoint.y - 64 }}>
        <span>{months[activeIndex].label}</span>
        <strong>{format(numbers[activeIndex])}</strong>
      </div>}
      <div className={s.months} aria-hidden="true">{points.map((point, index) => <span style={{ left: `${point.x / chartWidth * 100}%` }} key={months[index].id}>{months[index].shortLabel}</span>)}</div>
    </div>
    <p className={s.chartDescription}>{label} по месяцам · {formatUsageNumber(months.length)} месяцев</p>
  </div>;
}
