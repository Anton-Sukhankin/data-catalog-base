import { describe, expect, it } from 'vitest';
import { demoReportsGateway } from '../demo/reports';
import { searchReports } from './reports';

describe('agreed local report search', () => {
  it('matches names without case sensitivity and ignores outer whitespace', async () => {
    const reports = await demoReportsGateway.list();
    expect(searchReports(reports, '  ОТЧЁТ  ')).toHaveLength(4);
    expect(searchReports(reports, 'МОТИВАЦИИ').map((report) => report.id)).toEqual(['demo-report-motivation']);
  });
  it('searches the visible metadata and retains the matching entity identity', async () => {
    const reports = await demoReportsGateway.list();
    const [debt] = searchReports(reports, '1с жкх');
    expect(debt?.id).toBe('demo-report-debt');
    expect(debt?.title).toBe('Отчёт по дебиторской задолженности');
    expect(searchReports(reports, 'visiology').map(report => report.id)).toEqual(['demo-report-summary']);
    expect(searchReports(reports, 'СПЕКТР BI').map(report => report.id)).toEqual(['demo-report-motivation']);
  });
  it('distinguishes no input from a nonmatching query at the UI boundary', async () => {
    const reports = await demoReportsGateway.list();
    expect(searchReports(reports, '   ')).toEqual([]);
    expect(searchReports(reports, 'нет-такого-отчёта')).toEqual([]);
  });
});
