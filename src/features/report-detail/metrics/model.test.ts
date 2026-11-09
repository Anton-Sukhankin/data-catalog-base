import { describe, expect, it } from 'vitest';
import { demoMetricsSource } from './demoSource';
import { filterMetrics, metricPage } from './model';
import { demoMetricsGateway } from '../../../demo/metrics';

describe('related report metrics', () => {
  const items = demoMetricsSource.read('demo-report-summary')!;
  it('keeps report ownership and leaves unknown associations unknown', () => {
    expect(items).toHaveLength(10);
    expect(items.every(item => item.reportId === 'demo-report-summary')).toBe(true);
    const sales = demoMetricsSource.read('demo-report-sales-plan')!;
    expect(sales[0].id).not.toBe(items[0].id);
    expect(demoMetricsSource.read('unrelated-report')).toBeUndefined();
    expect(items[0].metricId).toBe('4');
    for (const item of items) {
      const { id: _id, metricId, reportId: _reportId, formula: _formula, ...summary } = item;
      const { id: canonicalId, ...canonical } = demoMetricsGateway.read(metricId)!;
      expect(summary).toEqual(canonical);
      expect(demoMetricsGateway.readDetail(canonicalId)?.metricId).toBe(canonicalId);
    }
  });
  it('combines visible filters with trimmed case-insensitive title/domain/formula search', () => {
    expect(filterMetrics(items, { query: '  СЕРТИФИКАТОВ ', type: 'Показатель', status: 'Проверена' })).toHaveLength(1);
    expect(filterMetrics(items, { query: 'маркетинг', type: '', status: '' })).toHaveLength(10);
    expect(filterMetrics(items, { query: '', type: '', status: 'Не проверена' })).toHaveLength(0);
    expect(filterMetrics([{ ...items[0], formula: 'SUM(sales)' }], { query: 'sum(', type: '', status: '' })).toHaveLength(1);
  });
  it('bounds pages after filtering and exposes actual total instead of the inconsistent screen counter', () => {
    expect(metricPage(items, 999).pageIndex).toBe(0);
    expect(metricPage(items, 0).total).toBe(10);
    expect(metricPage(items, 3, 3).items).toHaveLength(1);
    expect(metricPage([], 99)).toMatchObject({ items: [], total: 0, pageIndex: 0 });
  });
});
