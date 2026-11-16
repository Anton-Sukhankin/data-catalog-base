import type { AiFlag, AiSolution } from '../../data/aiHub';

export const aiFilterFields = {
  type: { label: 'Тип', all: 'Все типы' },
  domain: { label: 'Домен', all: 'Все домены' },
  status: { label: 'Статус', all: 'Все статусы' },
  platform: { label: 'Платформа', all: 'Все платформы' },
} as const;
export type AiFilterField = keyof typeof aiFilterFields;
export const aiFilterIds = Object.keys(aiFilterFields) as AiFilterField[];
export type AiFilterOptions = Record<AiFilterField, readonly { value: string; label: string }[]>;

export const aiFlags: readonly { id: AiFlag; label: string }[] = [
  { id: 'reuse', label: 'Рекомендуются к переиспользованию' },
  { id: 'friday', label: 'ИИ-пятница' },
  { id: 'talent', label: 'Клуб талантов' },
  { id: 'ui', label: 'Есть UI' },
];

export interface AiFilters {
  fields: Partial<Record<AiFilterField, readonly string[]>>;
  flags: readonly AiFlag[];
}

export type AiColumn = Exclude<AiFilterField, 'platform'>;
export type AiSort = { column: AiColumn; direction: 'asc' | 'desc' };
export const emptyAiFilters: AiFilters = { fields: {}, flags: [] };
export const aiKey = (id: string) => `ai.${id}`;

export function aiOptions(items: readonly AiSolution[]): AiFilterOptions {
  const optionsFor = (field: AiFilterField) => [...new Set(items.map(item => item[field]))]
    .map(value => ({ value, label: field === 'domain' && value === 'Все домены' ? 'Применимо ко всем доменам' : value }));
  return { type: optionsFor('type'), domain: optionsFor('domain'), status: optionsFor('status'), platform: optionsFor('platform') };
}

export function readAiFilters(params: URLSearchParams, options: AiFilterOptions): AiFilters {
  return {
    fields: Object.fromEntries(aiFilterIds.map(id => {
      const values = new Set(params.getAll(aiKey(id)));
      return [id, options[id].filter(option => values.has(option.value)).map(option => option.value)];
    })),
    flags: aiFlags.filter(flag => params.get(aiKey(flag.id)) === '1').map(flag => flag.id),
  };
}

export function writeAiFilters(params: URLSearchParams, filters: AiFilters) {
  for (const id of aiFilterIds) {
    params.delete(aiKey(id));
    for (const value of filters.fields[id] ?? []) params.append(aiKey(id), value);
  }
  for (const { id } of aiFlags) {
    if (filters.flags.includes(id)) params.set(aiKey(id), '1');
    else params.delete(aiKey(id));
  }
}

export function aiFilterCount(filters: AiFilters) {
  return aiFilterIds.filter(id => filters.fields[id]?.length).length + filters.flags.length;
}

export function sameAiFilters(first: AiFilters, second: AiFilters) {
  return aiFilterIds.every(id => sameValues(first.fields[id] ?? [], second.fields[id] ?? [])) && sameValues(first.flags, second.flags);
}

function sameValues(first: readonly string[], second: readonly string[]) {
  return first.length === second.length && first.every(value => second.includes(value));
}

export function toggleAiValue<Value extends string>(values: readonly Value[], value: Value) {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
}
