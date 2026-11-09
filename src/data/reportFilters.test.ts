import { describe, expect, it } from 'vitest';
import { readDemoReportRows } from '../demo/reportTable';
import { applyReportColumnDraft, applyReportRangeDraft, copyReportFilters, filterReportRows, reportFilterCount, reportFilterOptions, reportFiltersEqual, reportFiltersValid, searchReportFilterOptions } from './reportFilters';

describe('agreed demo report filtering', () => {
  it('combines inclusive and open numerical bounds before pagination and keeps missing values unknown', async () => {
    const rows = await readDemoReportRows();
    expect(filterReportRows(rows, { mau:{min:50,max:100} }).map(row=>row.id)).toEqual(['demo-report-motivation','demo-report-client-service','demo-report-sales-plan','demo-report-sales-funnel']);
    expect(filterReportRows(rows, { mau:{min:100},lastViewed:{max:2} }).map(row=>row.id)).toEqual(['demo-report-summary','demo-report-finance-plan']);
    expect(filterReportRows(rows, { mau:{min:500} })).toHaveLength(0);
    expect(filterReportRows(rows, { mau:{min:91,max:91} }).map(row=>row.id)).toEqual(['demo-report-motivation']);
    const missing = { ...rows[0],mau:'—',lastViewed:'—' };
    expect(filterReportRows([missing],{})).toHaveLength(1);
    expect(filterReportRows([missing],{mau:{min:0}})).toHaveLength(0);
    expect(filterReportRows([missing],{lastViewed:{max:30}})).toHaveLength(0);
  });
  it('counts each range once, copies its draft independently and removes only its own condition', () => {
    const applied = { mau:{min:50,max:100},lastViewed:{max:7},domain:['Гостеприимство'] };
    const draft=copyReportFilters(applied);
    expect(reportFilterCount(applied)).toBe(3);
    expect(draft.mau).not.toBe(applied.mau);
    draft.mau!.min=60;
    expect(applied.mau.min).toBe(50);
    expect(reportFiltersEqual(applied,draft)).toBe(false);
    expect(reportFiltersEqual(applied,copyReportFilters(applied))).toBe(true);
    expect(applyReportRangeDraft(applied,'mau',{})).toEqual({lastViewed:{max:7},domain:['Гостеприимство']});
  });
  it('rejects invalid range ordering, negatives and fractional values', () => {
    expect(reportFiltersValid({mau:{min:100,max:50}})).toBe(false);
    expect(reportFiltersValid({mau:{min:-1}})).toBe(false);
    expect(reportFiltersValid({lastViewed:{max:1.5}})).toBe(false);
    expect(reportFiltersValid({mau:{min:0},lastViewed:{min:0,max:0}})).toBe(true);
  });
  it('combines values with OR, columns with AND, and filters before pagination', async () => {
    const rows = await readDemoReportRows();
    const domains = filterReportRows(rows, { domain: ['Гостеприимство', 'Финансы'] });
    expect(domains).toHaveLength(6);
    const intersection = filterReportRows(rows, { domain: ['Гостеприимство', 'Финансы'], masterSystem: ['1С ЖКХ'] });
    expect(intersection.map(row => row.id)).toEqual(['demo-report-debt']);
    expect(filterReportRows(rows, { domain: [] })).toHaveLength(9);
    expect(filterReportRows(rows, { domain: ['Финансы'], masterSystem: ['Домиленд'] })).toHaveLength(0);
  });
  it('applies only one column and clearing its draft preserves other applied conditions', () => {
    const applied = { domain: ['Финансы'], platform: ['Visiology'] };
    const next = applyReportColumnDraft(applied, 'domain', []);
    expect(next).toEqual({ platform: ['Visiology'] });
    expect(applied.domain).toEqual(['Финансы']);
  });
  it('searches displayed option labels by case-insensitive substring without changing selected values', async () => {
    const rows = await readDemoReportRows();
    const options = reportFilterOptions(rows, 'title');
    expect(options).toHaveLength(9);
    expect(searchReportFilterOptions(options, 'ЗАДОЛЖЕН')).toEqual([{ value: 'Отчет по дебиторской задолженности', label: 'Отчет по дебиторской задолженности' }]);
    expect(searchReportFilterOptions(options, '')).toEqual(options);
    expect(searchReportFilterOptions(options, 'нет такого названия')).toEqual([]);
    expect(reportFilterOptions(rows, 'platform')).toHaveLength(9);
    expect(searchReportFilterOptions(reportFilterOptions(rows,'platform'),'СПЕКТР')).toEqual([{value:'Спектр BI · демо',label:'Спектр BI · демо'}]);
  });
  it('counts attributes rather than selected values and compares equivalent drafts as sets', () => {
    const applied = { domain: ['Гостеприимство', 'Финансы'], status: ['verified'] };
    expect(reportFilterCount(applied)).toBe(2);
    expect(reportFiltersEqual(applied, { status: ['verified'], domain: ['Финансы', 'Гостеприимство'] })).toBe(true);
    expect(reportFiltersEqual(applied, { status: ['verified'] })).toBe(false);
    const draft = copyReportFilters(applied);
    expect(draft.domain).not.toBe(applied.domain);
  });
  it('applies the explicit verification status without inventing records for missing results', async () => {
    const rows = await readDemoReportRows();
    expect(filterReportRows(rows, { status: ['verified'] })).toHaveLength(5);
    expect(filterReportRows(rows, { status: ['unverified'] }).map(row => row.id)).toEqual([
      'demo-report-occupancy', 'demo-report-client-service', 'demo-report-sales-funnel', 'demo-report-finance-plan',
    ]);
    expect(filterReportRows(rows, {})).toHaveLength(9);
    expect(reportFilterOptions(rows, 'status').map(option => option.label)).toEqual(['Все', 'Проверено', 'Не проверено']);
  });
});
