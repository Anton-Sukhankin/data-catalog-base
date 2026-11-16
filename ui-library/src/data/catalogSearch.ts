import type { ReportSummary } from './reports';
import { reportTablePage } from './reportTable';

export type SearchDestination =
  | { kind: 'report'; section: 'reports' | 'home'; report: ReportSummary }
  | { kind: 'source'; id: string; hasDetail: boolean }
  | { kind: 'metric'; id: string; hasDetail: boolean }
  | { kind: 'field'; sourceId: string }
  | { kind: 'term'; termId: string }
  | { kind: 'dictionary-domain'; domainId: string }
  | { kind: 'metric-block'; metricId: string; blockId: string }
  | { kind: 'ai-solution'; id: string }
  | { kind: 'system-reference'; id: string }
  | { kind: 'faq'; id: string }
  | { kind: 'appeal'; id: string };

export type SearchKind = SearchDestination['kind'];
export const searchGroupByKind = {
  report: 'reports',
  metric: 'metrics',
  'metric-block': 'metrics',
  source: 'sources',
  field: 'sources',
  term: 'dictionary',
  'dictionary-domain': 'dictionary',
  'ai-solution': 'ai',
  'system-reference': 'systems',
  faq: 'questions',
  appeal: 'questions',
} as const satisfies Record<SearchKind, string>;

export type SearchGroup = typeof searchGroupByKind[SearchKind];
export type SearchSection = { id: SearchGroup; label: string };
const searchableSections = new Set<string>(Object.values(searchGroupByKind));

export function isSearchGroup(id: string): id is SearchGroup {
  return searchableSections.has(id);
}

interface SearchValue {
  field: string;
  text: string;
  label?: string;
}

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  title: string;
  context: readonly string[];
  hint?: string;
  values: readonly SearchValue[];
  destination?: SearchDestination;
}

export interface SearchHit {
  entry: SearchEntry;
  value: SearchValue;
  query: string;
  occurrence?: number;
}

export function searchId(...parts: string[]) {
  return JSON.stringify(parts);
}

export function hasSearchDetail(destination: SearchDestination | undefined) {
  return destination?.kind === 'report' ||
    ((destination?.kind === 'source' || destination?.kind === 'metric') && destination.hasDetail);
}

export function catalogSearchItems<T extends { id: string }>(items: readonly T[], filtered: readonly T[], target?: string) {
  const outside = target && !filtered.some(item => item.id === target) ? items.find(item => item.id === target) : undefined;
  return { items: outside ? [outside] : filtered, outside: Boolean(outside) };
}

export function catalogSearchPage<T extends { id: string }>(rows: readonly T[], all: readonly T[], index: number, size: number, target?: string) {
  const { items, outside } = catalogSearchItems(all, rows, target);
  const matchIndex = target ? items.findIndex(row => row.id === target) : -1;
  return { ...reportTablePage(items, matchIndex < 0 ? index : Math.floor(matchIndex / size), size), outside };
}

export function normalizeSearch(text: string) {
  return text.toLocaleLowerCase('ru').replaceAll('ё', 'е');
}

export function searchOffsets(text: string, query: string): number[] {
  if (!query) return [];
  const normalized = normalizeSearch(text);
  const offsets: number[] = [];
  for (let offset = normalized.indexOf(query); offset !== -1; offset = normalized.indexOf(query, offset + query.length)) {
    offsets.push(offset);
  }
  return offsets;
}

export function findPageMatches(entries: readonly SearchEntry[], query: string): SearchHit[] {
  return entries.flatMap(entry => {
    const matchedFields = new Set<string>();
    return entry.values.flatMap(value => {
      if (matchedFields.has(value.field)) return [];
      const offsets = searchOffsets(value.text, query);
      if (offsets.length) matchedFields.add(value.field);
      return offsets.map((_, occurrence) => ({ entry, value, query, occurrence }));
    });
  });
}

export function findCatalogHits(entries: readonly SearchEntry[], input: string): SearchHit[] {
  const query = normalizeSearch(input.trim());
  if (!query) return [];

  return entries.flatMap(entry => {
    const value = entry.values.find(item => normalizeSearch(item.text).includes(query));
    if (!value) return [];
    const rank = value.field !== 'title' ? 2 : normalizeSearch(value.text) === query ? 0 : 1;
    return [{ entry, value, query, rank }];
  }).sort((a, b) => a.rank - b.rank);
}
