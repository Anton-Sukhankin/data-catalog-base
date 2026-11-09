import { catalogSearchPage } from './catalogSearch';
import { listPageSize } from './pagination';

export type DictionaryView = 'all' | 'terms' | 'processes' | 'domains';

export interface DictionaryTerm {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  /** A visible source excerpt must not be expanded into an invented definition. */
  descriptionComplete: boolean;
  domain?: string;
  owner?: string;
}

export interface DictionaryDomain { id: string; name: string }

export interface DictionaryCatalog {
  terms: readonly DictionaryTerm[];
  domains: readonly DictionaryDomain[];
  provenance: { kind: 'demo'; reference: string };
}

export interface DictionaryGateway { read(): DictionaryCatalog }

export function readDictionaryView(value: string | null): DictionaryView {
  return value === 'terms' || value === 'domains' || value === 'processes' ? value : 'all';
}

export type DictionaryFilterView = 'all' | 'terms';
export const dictionaryFilterFields = ['type', 'domain', 'status', 'owner'] as const;
export type DictionaryFilterField = typeof dictionaryFilterFields[number];
type DictionaryFilters = Record<DictionaryFilterField, readonly string[]>;
type FilterValues = Partial<Record<DictionaryFilterField, { value: string; label: string }>>;

export function isDictionarySingleFilter(field: DictionaryFilterField) {
  return field !== 'domain';
}

const missing = (label: string) => ({ value: 'missing', label });
const option = (label: string) => ({ value: `value:${label}`, label });

function termValues(term: DictionaryTerm): FilterValues {
  return {
    type: option(term.type),
    domain: term.domain ? option(term.domain) : missing('Без домена'),
    status: option(term.status),
    owner: term.owner ? option(term.owner) : missing('Не указан'),
  };
}

function domainValues(domain: DictionaryDomain): FilterValues {
  return { type: { value: 'domain-row', label: 'Домен' }, domain: option(domain.name) };
}

export function dictionaryFilterKey(view: DictionaryFilterView, field: DictionaryFilterField) {
  return `dictionary.${view}.${field}`;
}

export function readDictionaryFilters(params: URLSearchParams, view: DictionaryFilterView, options: ReturnType<typeof dictionaryFilterOptions>): DictionaryFilters {
  const read = (field: DictionaryFilterField) => {
    const values = [...new Set(params.getAll(dictionaryFilterKey(view, field)))]
      .filter(value => options[field].some(option => option.value === value));
    return isDictionarySingleFilter(field) ? values.slice(0, 1) : values;
  };
  return {
    type: read('type'),
    domain: read('domain'),
    status: read('status'),
    owner: read('owner'),
  };
}

export function dictionaryFilterOptions(terms: readonly DictionaryTerm[], domains: readonly DictionaryDomain[]) {
  const rows = [...domains.map(domainValues), ...terms.map(termValues)];
  return Object.fromEntries(dictionaryFilterFields.map(field => {
    const distinct = new Map<string, { value: string; label: string }>();
    for (const row of rows) {
      const value = row[field];
      if (value) distinct.set(value.value, value);
    }
    return [field, [...distinct.values()]];
  })) as Record<DictionaryFilterField, { value: string; label: string }[]>;
}

function matches(filters: DictionaryFilters, row: FilterValues, fields: readonly DictionaryFilterField[] = dictionaryFilterFields) {
  return fields.every(field => !filters[field].length || filters[field].includes(row[field]?.value ?? ''));
}

export function filterDictionaryTerms(terms: readonly DictionaryTerm[], filters: DictionaryFilters, targetId?: string) {
  const items = terms.filter(term => matches(filters, termValues(term)));
  const outside = targetId && !items.some(term => term.id === targetId) ? terms.find(term => term.id === targetId) : undefined;
  return { items: outside ? [outside] : items, outside: Boolean(outside) };
}

export function filterDictionaryDomains(domains: readonly DictionaryDomain[], filters: DictionaryFilters) {
  return domains.filter(domain => matches(filters, domainValues(domain), ['type', 'domain']));
}

export const dictionaryPageParam = 'dictionaryPage';

export function dictionaryTermsPage(terms: readonly DictionaryTerm[], filters: DictionaryFilters, params: URLSearchParams, targetId?: string) {
  const requested = Number(params.get(dictionaryPageParam));
  const { items } = filterDictionaryTerms(terms, filters);
  return catalogSearchPage(items, terms, requested, listPageSize, targetId);
}
