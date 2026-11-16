import type { ReportFilterColumn } from './reportFilters';
import type { ReportTableRow } from './reportTable';

export interface ReportSort { column: ReportFilterColumn; direction: 'asc' | 'desc' }
const russianText = new Intl.Collator('ru', { sensitivity: 'base' });
const isMissing = (value: string) => value.trim() === '' || value.trim() === '—';

/** Agreed demo comparison only; values are source displays, not server metrics. */
function compare(left: ReportTableRow, right: ReportTableRow, sort: ReportSort) {
  const a = left[sort.column];
  const b = right[sort.column];
  if (isMissing(a) || isMissing(b)) return Number(isMissing(a)) - Number(isMissing(b));
  let result: number;
  if (sort.column === 'mau') result = Number(a.replace(/\s/g, '')) - Number(b.replace(/\s/g, ''));
  else if (sort.column === 'lastViewed') result = Number.parseInt(a, 10) - Number.parseInt(b, 10);
  else result = russianText.compare(a, b);
  return (Number.isFinite(result) ? result : 0) * (sort.direction === 'asc' ? 1 : -1);
}

/** Preserve domain grouping as in the title-sort pilot. Pagination follows sorting. */
export function sortReportRows(rows: readonly ReportTableRow[], sort?: ReportSort): ReportTableRow[] {
  if (!sort) return [...rows];
  const groups = new Map<string, { row: ReportTableRow; index: number }[]>();
  rows.forEach((row, index) => {
    const group = groups.get(row.domain) ?? [];
    group.push({ row, index });
    groups.set(row.domain, group);
  });
  const ordered = [...groups.values()];
  if (sort.column === 'domain') ordered.sort((a, b) => compare(a[0].row, b[0].row, sort) || a[0].index - b[0].index);
  else for (const group of ordered) group.sort((a, b) => compare(a.row, b.row, sort) || a.index - b.index);
  return ordered.flatMap(group => group.map(item => item.row));
}
