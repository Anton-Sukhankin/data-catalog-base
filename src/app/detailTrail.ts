export type DetailKind = 'report' | 'metric' | 'source';
export const detailTrailParam = 'detailVia';

export function readDetail(params: URLSearchParams) {
  for (const kind of ['report', 'metric', 'source'] as const) {
    const id = params.get(kind);
    if (id) return { kind, id };
  }
}

export function readDetailTrail(params: URLSearchParams, section: string) {
  return params.getAll(detailTrailParam).map(value => new URLSearchParams(value))
    .filter(step => step.get('section') === section && readDetail(step));
}

export function withoutDetail(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  for (const key of [...next.keys()]) {
    if (['report', 'reportTab', 'metric', 'source', 'sourceTab', 'sourceReport', detailTrailParam].includes(key)
      || key.startsWith('relatedMetric')) next.delete(key);
  }
  return next;
}
