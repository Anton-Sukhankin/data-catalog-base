export const homeTabs = [
  { id: 'reports', label: 'Отчёты' }, { id: 'sources', label: 'Источники' },
  { id: 'ai-hub', label: 'AI Hub' }, { id: 'news', label: 'Новости' },
];
export const homeReportSegments = [
  { id: 'favorites', label: 'Избранные' }, { id: 'domains', label: 'Домены' },
  { id: 'subscriptions', label: 'Мои подписки' },
  { id: 'contribution', label: 'Вклад в каталог' },
] as const;
export const homeContributionTypes = [{ id: 'contributors', label: 'Контрибьюторы' }, { id: 'platforms', label: 'Платформы' }];
export const homeNewsCategories = [
  { id: 'all', label: 'Все' }, { id: 'new', label: 'Новое' },
  { id: 'important', label: 'Важное' }, { id: 'changes', label: 'Изменения', unselectedSurface: 'neutral' as const },
];
