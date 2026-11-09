import type { MetricSummary } from '../../../data/metrics';
import { paginate } from '../../../data/pagination';

export interface RelatedMetric extends Omit<MetricSummary, 'id'> {
  /** Relationship identity differs from the canonical metric identity. */
  metricId: string;
  id: string;
  reportId: string;
  /** Optional: the target screenshots do not expose formula values. */
  formula?: string;
}

export interface MetricsSource {
  /** undefined means that no related-metric fixture has been established for this report. */
  read(reportId: string): readonly RelatedMetric[] | undefined;
}

export interface MetricFilters { query: string; type: string; status: string }

export function filterMetrics(items: readonly RelatedMetric[], filters: MetricFilters): readonly RelatedMetric[] {
  const query = filters.query.trim().toLocaleLowerCase('ru');
  return items.filter(item => (!filters.type || item.type === filters.type)
    && (!filters.status || item.status === filters.status)
    && (!query || [item.title, item.domain, item.formula ?? ''].some(value => value.toLocaleLowerCase('ru').includes(query))));
}

export function metricPage(items: readonly RelatedMetric[], requestedPage: number, pageSize?: number) {
  const { rows, ...page } = paginate(items, requestedPage, pageSize);
  return { ...page, items: rows };
}
