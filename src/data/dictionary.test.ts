import { expect, it } from 'vitest';
import { dictionaryFilterOptions, filterDictionaryDomains, filterDictionaryTerms, readDictionaryFilters, type DictionaryTerm } from './dictionary';

it('uses actual dictionary attributes and preserves a search target outside the active filters', () => {
  const term = { name: 'Пример', type: 'Бизнес-термин', description: '', descriptionComplete: true };
  const terms: DictionaryTerm[] = [
    { ...term, id: 'linked', status: 'Утверждён', domain: 'Первый', owner: 'Владелец примера' },
    { ...term, id: 'unassigned', status: 'Черновик' },
  ];
  const domains = [{ id: 'domain', name: 'Первый' }, { id: 'unrelated', name: 'Второй' }];
  const all = dictionaryFilterOptions(terms, domains);
  const termsOnly = dictionaryFilterOptions(terms, []);
  expect(all.domain.map(option => option.label)).toEqual(['Первый', 'Второй', 'Без домена']);
  expect(termsOnly.domain.map(option => option.label)).toEqual(['Первый', 'Без домена']);
  expect(termsOnly.owner.map(option => option.label)).toEqual(['Владелец примера', 'Не указан']);

  const params = new URLSearchParams([
    ['dictionary.all.domain', all.domain[0].value], ['dictionary.all.domain', all.domain[2].value],
    ['dictionary.all.type', 'invalid'], ['dictionary.all.type', all.type[1].value], ['dictionary.all.type', all.type[0].value],
    ['dictionary.all.status', all.status[1].value],
    ['dictionary.terms.domain', 'invalid'], ['dictionary.terms.owner', termsOnly.owner[0].value],
    ['dictionary.terms.owner', termsOnly.owner[1].value],
  ]);
  const mixed = readDictionaryFilters(params, 'all', all);
  expect(mixed.type).toEqual([all.type[1].value]);
  expect(mixed.domain).toEqual([all.domain[0].value, all.domain[2].value]);
  expect(filterDictionaryTerms(terms, mixed).items.map(item => item.id)).toEqual(['unassigned']);
  expect(filterDictionaryDomains(domains, mixed)).toEqual([]);
  const termFilters = { ...mixed, type: [], owner: termsOnly.owner.slice(0, 1).map(option => option.value) };
  expect(filterDictionaryDomains(domains, termFilters)).toEqual([domains[0]]);
  expect(filterDictionaryDomains(domains, { ...termFilters, domain: [] })).toEqual(domains);

  const only = readDictionaryFilters(params, 'terms', termsOnly);
  expect(only.owner).toEqual([termsOnly.owner[0].value]);
  expect(only.domain).toEqual([]);
  expect(filterDictionaryTerms(terms, only)).toEqual({ items: [terms[0]], outside: false });
  expect(filterDictionaryTerms(terms, only, 'unassigned')).toEqual({ items: [terms[1]], outside: true });
});
