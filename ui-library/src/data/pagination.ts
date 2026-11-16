export const listPageSize = 15;

export function paginate<T>(rows: readonly T[], requestedPage: number, pageSize = listPageSize) {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('Page size must be a positive integer');
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageIndex = Number.isSafeInteger(requestedPage) ? Math.min(Math.max(0, requestedPage), pageCount - 1) : 0;
  return { rows: rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize), total: rows.length, pageIndex, pageSize, pageCount };
}
