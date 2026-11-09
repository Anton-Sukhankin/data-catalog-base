import type { ContributorCardData } from './ContributorCard';

// Display values from group478:8878. IDs identify technical examples only.
export const previewContributors: readonly ContributorCardData[] = [
  {
    id: 'demo-contributor-1', rankLabel: '1', name: 'Лапова Юлия Владимировна', roleLabel: 'Аналитик',
    jobTitle: 'Бизнес-аналитик', department: 'Дирекция развития ИИ-платформы продукта и продаж',
    metrics: [
      { label: 'Проверок', value: '116' }, { label: 'Всего', value: '143' },
      { label: 'К проверке', value: '29' }, { label: 'Проверено (назначенных)', value: '80%' },
    ],
  },
  {
    id: 'demo-contributor-2', rankLabel: '2', name: 'Губина Екатерина Игоревна', roleLabel: 'Self-service',
    jobTitle: 'Бизнес-аналитик', department: 'Операционный блок',
    metrics: [
      { label: 'Проверок', value: '10' }, { label: 'Всего', value: '15' },
      { label: 'К проверке', value: '5' }, { label: 'Проверено (назначенных)', value: '67%' },
    ],
  },
  ...['03', '04', '05'].map((suffix, index): ContributorCardData => ({
    id: `demo-contributor-${index + 3}`, rankLabel: String(index + 3), name: `Участник примера ${suffix}`,
    roleLabel: 'Аналитик', jobTitle: 'Бизнес-аналитик', department: 'Подразделение не указано',
    metrics: [
      { label: 'Проверок', value: '0' }, { label: 'Всего', value: '0' },
      { label: 'К проверке', value: '0' }, { label: 'Проверено (назначенных)', value: '0%' },
    ],
  })),
];
