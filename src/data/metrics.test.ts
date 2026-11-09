import { describe, expect, it } from 'vitest';
import { filterMetricCatalog } from './metrics';
import { demoMetricsGateway, reportMetricIds } from '../demo/metrics';

describe('approved metric catalog data', () => {
  const items = demoMetricsGateway.list();
  it('keeps nine identities, including the two separate revenues', () => {
    expect(items).toHaveLength(9);
    expect(new Set(items.map(item => item.id)).size).toBe(9);
    const revenue = items.filter(item => item.title === 'Выручка');
    expect(revenue).toHaveLength(2);
    expect(revenue[0].id).not.toBe(revenue[1].id);
    expect(revenue.map(item => demoMetricsGateway.read(item.id))).toEqual(revenue);
  });
  it('intersects type and status without changing the objects', () => {
    expect(filterMetricCatalog(items, { type: 'Метрика', status: '' })).toHaveLength(2);
    expect(filterMetricCatalog(items, { type: 'Показатель', status: '' })).toHaveLength(7);
    expect(filterMetricCatalog(items, { type: '', status: 'Черновик' })).toHaveLength(8);
    expect(filterMetricCatalog(items, { type: '', status: 'Проверена' })).toHaveLength(1);
    expect(filterMetricCatalog(items, { type: 'Метрика', status: 'Проверена' })).toEqual([]);
    expect(filterMetricCatalog(items, { type: 'Показатель', status: 'Проверена' }).map(item => item.id)).toEqual(['4']);
    expect(filterMetricCatalog(items, { type: '', status: '' })).toEqual(items);
  });
  it('provides an identity-bound full profile for every actual entry, keeping source provenance', () => {
    const ids = [...new Set([...items.map(item => item.id), ...reportMetricIds])];
    expect(ids).toHaveLength(18);
    const definitions = new Set<string>();
    const formulas = new Set<string>();
    for (const id of ids) {
      const metric = demoMetricsGateway.read(id)!;
      const profile = demoMetricsGateway.readDetail(id)!;
      expect(profile.metricId).toBe(metric.id);
      expect(profile.sections).toHaveLength(12);
      expect(profile.sections.every(section => Boolean(section.title))).toBe(true);
      expect(profile.people.length).toBeGreaterThan(0);
      expect(profile.sections[0].body.kind).toBe('prose');
      expect(profile.sections[2].body.kind).toBe('prose');
      const definition = profile.sections[0].body;
      const formula = profile.sections[2].body;
      if (definition.kind === 'prose') definitions.add(definition.text);
      if (formula.kind === 'prose') formulas.add(formula.text);
      expect(profile.provenance.kind).toBe(id === '4' ? 'figma' : 'demo');
      expect(profile.displayId).toBe(id === '4' ? '4' : undefined);
      if (id !== '4') expect(profile.people.some(person => person.description.includes('@samolet.ru'))).toBe(false);
    }
    expect(definitions.size).toBe(18);
    expect(formulas.size).toBe(18);
    expect(demoMetricsGateway.readDetail('4')?.sections[2].body).toEqual({ kind: 'prose', text: 'SUM(Метры), SUM(Метры СП)' });
    expect(demoMetricsGateway.read('4')?.title).toBe('Объём продаж');
    expect(demoMetricsGateway.read('unknown')).toBeUndefined();
    expect(demoMetricsGateway.readDetail('unknown')).toBeUndefined();
  });
});
