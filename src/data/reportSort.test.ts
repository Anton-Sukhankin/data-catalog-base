import { describe, expect, it } from 'vitest';
import { readDemoReportRows } from '../demo/reportTable';
import { sortReportRows } from './reportSort';

describe('agreed local sorting inside domain groups', () => {
  it('matches the title pilot and restores source order without mutating rows', async () => {
    const rows = await readDemoReportRows();
    const original = rows.map(row => row.id);
    const sorted = sortReportRows(rows, { column: 'title', direction: 'asc' });
    expect(sorted.slice(0,5).map(row => row.id)).toEqual(['demo-report-occupancy','demo-report-motivation','demo-report-debt','demo-report-summary','demo-report-management']);
    expect([...new Set(sorted.map(row => row.domain))]).toEqual([...new Set(rows.map(row => row.domain))]);
    expect(sortReportRows(rows).map(row => row.id)).toEqual(original);
    expect(rows.map(row => row.id)).toEqual(original);
  });
  it('sorts actual numbers/days, keeps ties stable and missing values last in either direction', async () => {
    const rows = (await readDemoReportRows()).slice(0,4).map((row,index) => ({...row,mau:['2','100','2','—'][index],lastViewed:['12 дн. назад','3 дн. назад','3 дн. назад','—'][index]}));
    expect(sortReportRows(rows,{column:'mau',direction:'asc'}).map(row=>row.id)).toEqual([rows[0].id,rows[2].id,rows[1].id,rows[3].id]);
    expect(sortReportRows(rows,{column:'mau',direction:'desc'}).map(row=>row.id)).toEqual([rows[1].id,rows[0].id,rows[2].id,rows[3].id]);
    expect(sortReportRows(rows,{column:'lastViewed',direction:'asc'}).map(row=>row.id)).toEqual([rows[1].id,rows[2].id,rows[0].id,rows[3].id]);
    expect(sortReportRows(rows,{column:'lastViewed',direction:'desc'}).map(row=>row.id)).toEqual([rows[0].id,rows[1].id,rows[2].id,rows[3].id]);
  });
});
