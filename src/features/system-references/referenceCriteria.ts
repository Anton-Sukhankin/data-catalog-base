export const referenceCriteria = [
  { key: 'entityName', label: 'Отображаемое имя сущности', shortLabel: 'Сущность', placeholder: 'Организация' },
  { key: 'attributeName', label: 'Отображаемое имя атрибута', shortLabel: 'Атрибут', placeholder: 'Категория' },
  { key: 'entityLogicalName', label: 'Логическое имя сущности', shortLabel: 'Логическое имя сущности', placeholder: 'account' },
  { key: 'attributeLogicalName', label: 'Логическое имя атрибута', shortLabel: 'Логическое имя атрибута', placeholder: 'industrycode' },
  { key: 'relationship', label: 'Поиск по связям', shortLabel: 'Связи', placeholder: 'Организация' },
  { key: 'option', label: 'Поиск по опциям', shortLabel: 'Опции', placeholder: 'Продавец' },
] as const;

export type ReferenceCriterion = typeof referenceCriteria[number];
export type ReferenceCriterionKey = ReferenceCriterion['key'];
export const referenceChevron = '/images/metrics/catalog/chevron-down.svg';
