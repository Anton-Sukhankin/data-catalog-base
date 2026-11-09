import { reportPassportExamples } from '../../../demo/reportPassports';
import { formatUsageChange, formatUsageDecimal } from './model';
import type { ReportUsage, ReportUsageSource, UsageMonth } from './model';

// Approved Paper screen fixture. These monthly values were authored for the mockup,
// not extracted from production; they must never be assigned to arbitrary reports.
const months = [
  ['Январь', 'Янв 2026', 66, 183, 24, 7.1, 15, 11],
  ['Февраль', 'Фев', 110, 322, 27, 14.5, 28, 13],
  ['Март', 'Мар', 99, 285, 29, 11.6, 24, 12],
  ['Апрель', 'Апр', 84, 248, 26, 8.9, 18, 11],
  ['Май', 'Май', 98, 310, 28, 12.1, 25, 12],
  ['Июнь', 'Июн', 98, 329, 27, 12.4, 27, 13],
  ['Июль', 'Июл', 111, 371, 30, 15.2, 31, 14],
  ['Август', 'Авг', 104, 352, 28, 14, 29, 13],
  ['Сентябрь', 'Сен', 98, 284, 27, 12.7, 26, 13],
  ['Октябрь', 'Окт', 93, 414, 29, 13.8, 27, 15],
] as const;
const history: readonly UsageMonth[] = months.map(([name, shortLabel, mau, events, activeDays, averageDau, peakDau, regularity], i) => ({
  id: `2026-${String(i + 1).padStart(2, '0')}`, label: `${name} 2026`, shortLabel,
  mau, events, activeDays, averageDau, peakDau, regularity,
  // Arithmetic is only for this illustrative fixture, not a product calculation rule.
  mauChange: i ? Math.round((mau / months[i - 1][2] - 1) * 1000) / 10 : null,
  eventChange: i ? Math.round((events / months[i - 1][3] - 1) * 1000) / 10 : null,
  audience: 'Массовый отчёт',
}));

export const paperUsageExample: ReportUsage = {
  platform: 'Visiology · данные примера',
  current: [
    { label: 'Пользователи', value: '102' }, { label: 'События', value: '414' },
    { label: 'Средний DAU', value: '13,8' }, { label: 'Активные дни', value: '29' },
    { label: 'Регулярность', value: '14%' }, { label: 'Индекс значимости', value: '0,63' },
    { label: 'Последняя активность', value: '1 день назад' }, { label: 'Рост событий', value: '+46%' },
  ],
  lifetimePeriod: 'Январь — октябрь 2026',
  lifetime: [
    { label: 'Уникальные пользователи', value: '258' }, { label: 'Средний MAU', value: '96,1' },
    { label: 'Пиковый MAU', value: '111' }, { label: 'Динамика MAU · последние 3 месяца', value: '−4%' },
    { label: 'Месяцев с активностью', value: '10' }, { label: 'Доля активных месяцев', value: '100%' },
    { label: 'Первый месяц активности', value: 'Январь 2026' }, { label: 'Последний месяц активности', value: 'Октябрь 2026' },
    { label: 'Месяцев в жизненном цикле', value: '10' },
  ],
  classifications: [
    { label: 'Текущий статус', value: 'Популярный отчёт' },
    { label: 'Статус жизненного цикла', value: 'Стабильный отчёт' },
    { label: 'Текущая аудитория', value: 'Массовый отчёт' },
    { label: 'Историческая аудитория', value: 'Широко используемый отчёт' },
  ],
  history,
  chartMonthIds: history.slice(0, 9).map(month => month.id),
  provenance: {
    summary: 'SRC-09, 21.10.2026: historical report 193 inside an explicitly authored prototype fixture.',
    history: 'Illustrative values authored in Paper screen 06; not production observations.',
  },
};

function exampleUsage(monthlyUsers: readonly number[]): ReportUsage {
  // Generate a consistent set of visible statistics for the fixture, with no product formula.
  const monthLabels = history.slice(-monthlyUsers.length);
  const rows: UsageMonth[] = [];
  monthlyUsers.forEach((mau, index) => {
    const { id, label, shortLabel } = monthLabels[index];
    const events = mau * 3 + index * 7;
    const averageDau = Math.round(mau * (2 + index * 0.08)) / 10;
    const previous = rows.at(-1);
    rows.push({
      id, label, shortLabel, mau, events, averageDau, activeDays: 18 + index,
      peakDau: Math.ceil(averageDau * 1.7),
      regularity: Math.round(averageDau / mau * 100),
      significance: (38 + index * 7) / 100,
      mauChange: previous ? Math.round((mau / previous.mau - 1) * 1000) / 10 : null,
      eventChange: previous ? Math.round((events / previous.events - 1) * 1000) / 10 : null,
      audience: 'Рабочая группа',
    });
  });
  const first = rows[0];
  const latest = rows.at(-1)!;
  const peak = Math.max(...monthlyUsers);
  const average = monthlyUsers.reduce((sum, value) => sum + value, 0) / monthlyUsers.length;
  return {
    platform: 'Локальный пример',
    current: [
      { label: 'Пользователи', value: String(latest.mau) },
      { label: 'События', value: String(latest.events) },
      { label: 'Средний DAU', value: formatUsageDecimal(latest.averageDau) },
      { label: 'Активные дни', value: String(latest.activeDays) },
      { label: 'Регулярность', value: `${latest.regularity}%` },
      { label: 'Индекс значимости', value: latest.significance!.toFixed(2).replace('.', ',') },
      { label: 'Последняя активность', value: '31.10.2026' },
      { label: 'Рост событий', value: formatUsageChange(latest.eventChange) },
    ],
    lifetimePeriod: 'Май — октябрь 2026',
    lifetime: [
      { label: 'Уникальные пользователи', value: String(peak + first.mau) },
      { label: 'Средний MAU', value: formatUsageDecimal(average) },
      { label: 'Пиковый MAU', value: String(peak) },
      { label: 'Динамика MAU · последние 3 месяца', value: formatUsageChange(Math.round((latest.mau / rows.at(-3)!.mau - 1) * 1000) / 10) },
      { label: 'Месяцев с активностью', value: String(rows.length) },
      { label: 'Доля активных месяцев', value: '100%' },
      { label: 'Первый месяц активности', value: first.label },
      { label: 'Последний месяц активности', value: latest.label },
      { label: 'Месяцев в жизненном цикле', value: String(rows.length) },
    ],
    classifications: [
      { label: 'Текущий статус', value: 'Активный отчёт' },
      { label: 'Статус жизненного цикла', value: 'Регулярное использование' },
      { label: 'Текущая аудитория', value: latest.audience },
      { label: 'Историческая аудитория', value: 'Пользователи раздела' },
    ],
    history: rows,
    chartMonthIds: rows.map(month => month.id),
    provenance: { summary: 'Локальная демонстрация для выбранного отчёта.', history: 'Синтетические помесячные данные для проверки интерфейса.' },
  };
}

const examples = new Map(Array.from(reportPassportExamples, ([id, example]) => [id, exampleUsage(example.monthlyUsers)]));
examples.set('demo-report-summary', paperUsageExample);
export const demoReportUsageSource: ReportUsageSource = { read: reportId => examples.get(reportId) };
