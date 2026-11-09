export interface UsageField {
  label: string;
  value: string;
}

export interface UsageMonth {
  id: string;
  label: string;
  shortLabel: string;
  mau: number;
  events: number;
  activeDays: number;
  averageDau: number;
  peakDau: number;
  regularity: number;
  mauChange: number | null;
  eventChange: number | null;
  audience: string;
  significance?: number;
}

export interface ReportUsage {
  platform: string;
  current: readonly UsageField[];
  lifetime: readonly UsageField[];
  lifetimePeriod: string;
  classifications: readonly [UsageField, UsageField, UsageField, UsageField];
  history: readonly UsageMonth[];
  chartMonthIds: readonly string[];
  /** Provenance stays at the data boundary; the approved screen has no demo badges. */
  provenance: { summary: string; history: string };
}

export interface ReportUsageSource {
  read(reportId: string): ReportUsage | undefined;
}

export const usageMetrics = [
  { id: 'mau', label: 'MAU' },
  { id: 'events', label: 'События' },
  { id: 'averageDau', label: 'Средний DAU' },
  { id: 'regularity', label: 'Регулярность' },
  { id: 'significance', label: 'Индекс значимости' },
] as const;
export type UsageMetric = typeof usageMetrics[number]['id'];

const decimal = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
export const formatUsageNumber = (value: number) => integer.format(value);
export const formatUsageDecimal = (value: number) => decimal.format(value);
export function formatUsageChange(value: number | null): string {
  if (value === null) return 'н/д';
  if (value === 0) return '0%';
  return `${value > 0 ? '+' : '−'}${decimal.format(Math.abs(value))}%`;
}

export function usageChartDomain(metric: UsageMetric, values: readonly number[]): number {
  const maximum = Math.max(0, ...values);
  if (metric === 'mau') return Math.max(120, Math.ceil(maximum / 30) * 30);
  if (metric === 'events') return Math.max(100, Math.ceil(maximum / 100) * 100);
  if (metric === 'significance') return Math.max(1, Math.ceil(maximum));
  return Math.max(20, Math.ceil(maximum / 20) * 20);
}
