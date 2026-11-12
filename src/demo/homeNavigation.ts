// Source display counts are examples for sections that are not connected yet.
export const homeTabs = [
  { id: 'reports', label: 'Отчёты', count: 10 }, { id: 'sources', label: 'Источники', count: 10 },
  { id: 'ai-hub', label: 'AI Hub', count: 8 }, { id: 'news', label: 'Новости' },
];
export const homeReportSegments = [
  { id: 'favorites', label: 'Избранные', count: 10 }, { id: 'domains', label: 'Домены' },
  { id: 'subscriptions', label: 'Мои подписки', count: 5 },
  { id: 'contribution', label: 'Вклад в каталог', count: 5 },
];
export const homeContributionTypes = [{ id: 'contributors', label: 'Контрибьюторы' }, { id: 'platforms', label: 'Платформы' }];
export const homeNewsCategories = [
  { id: 'all', label: 'Все' }, { id: 'new', label: 'Новое' },
  { id: 'important', label: 'Важное' }, { id: 'changes', label: 'Изменения', unselectedSurface: 'neutral' as const },
];
