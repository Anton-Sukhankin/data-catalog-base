import { describe, expect, it } from 'vitest';
import { reportTableLayout, reportTablePage } from './reportTable';
import { readDemoReportTable } from '../demo/reportTable';

describe('documented report table constraints', () => {
  it('keeps fixed edges and gives equal extra width only to six middle columns', () => {
    expect(reportTableLayout(1088)).toMatchObject({ report: 360, edit: 64, middle: [132,140,180,180,200,120], overflow: 288 });
    expect(reportTableLayout(1096).overflow).toBe(280);
    expect(reportTableLayout(1568)).toMatchObject({ report: 360, edit: 64, middle: [164,172,212,212,232,152], overflow: 0 });
  });
  it('changes actual objects on the next page and keeps a consistent range at the end', async () => {
    const first = await readDemoReportTable(0, 8);
    const last = await readDemoReportTable(1, 8);
    expect(first).toMatchObject({ total: 9, pageCount: 2, pageIndex: 0 });
    expect(first.rows).toHaveLength(8);
    expect(last.rows.map((row) => row.id)).toEqual(['demo-report-finance-plan']);
    expect(new Set([...first.rows,...last.rows].map((row) => row.id)).size).toBe(9);
    expect(first.rows[2].report).toMatchObject({ id: 'demo-report-debt', masterSystem: '1С ЖКХ' });
  });
  it('distinguishes the one-page boundary from one extra record', async () => {
    const all = (await readDemoReportTable(0, 20)).rows;
    expect(reportTablePage(all.slice(0,8), 0, 8).pageCount).toBe(1);
    expect(reportTablePage(all, 0, 8).pageCount).toBe(2);
  });
  it('keeps table aliases separate from the same object used by cards and search', async () => {
    const all = (await readDemoReportTable(0,20)).rows;
    const occupancy = all.find(row=>row.id === 'demo-report-occupancy')!;
    expect(occupancy.domain).toBe('Гостеприимство');
    expect(occupancy.report).toMatchObject({domain:'Гостеприимство · демо',domainGroup:'Гостеприимство',verification:{status:'unverified'}});
    const salesPlan = all.find(row=>row.id === 'demo-report-sales-plan')!;
    expect(salesPlan.report).toMatchObject({id:salesPlan.id,title:salesPlan.title,verification:{status:'verified',reviewer:'—'}});
  });
});
