import type { ColumnFilterOption } from '../../components/ColumnFilterMenu/ColumnFilterMenu';

export interface FilterPreviewExample {
  key: string;
  label: string;
  options: readonly ColumnFilterOption[];
  selected: readonly string[];
}

const options = (labels: readonly string[]): ColumnFilterOption[] => labels.map((label, index) => ({ value: String(index + 1), label }));

// Exact display examples of the local Figma menus; not the application's option registry.
export const filterExamples: readonly FilterPreviewExample[] = [
  { key: 'report', label: 'Отчёт', selected: ['1', '2', '9'], options: options([
    'Сводный отчёт Гостеприимства', 'План-Факт продажи', 'Мотивация сотрудников',
    'Отчет по дебиторской задолженности', 'УК Москва/СПБ', 'Динамика заселения',
    'Воронка продаж', 'Качество клиентского сервиса', 'Выполнение плана поступлений',
  ]) },
  { key: 'domain', label: 'Домен', selected: ['1', '2'], options: options([
    'Гостеприимство', 'Продажи и маркетинг', 'Клиентский сервис', 'Финансы',
    'Управление персоналом', 'Строительство', 'Закупки', 'Информационные технологии',
  ]) },
  { key: 'platform', label: 'Платформа', selected: ['1'], options: options(['Visiology']) },
  { key: 'master', label: 'Мастер-система', selected: ['1', '2'], options: options([
    'Домиленд', 'CRM (CRM Dynamics)', '1С ЖКХ', 'CRM Dynamics', 'Service Desk', '1С ERP',
  ]) },
  { key: 'mau', label: 'MAU', selected: ['1', '2', '9'], options: options(['146', '98', '91', '31', '30', '124', '76', '58', '203']) },
  { key: 'owner', label: 'Владелец', selected: ['1', '2'], options: options(['Головин Ю.', 'Ручнов К.']) },
  { key: 'viewed', label: 'Просмотр', selected: ['1', '2'], options: options(['1 дн. назад', '12 дн. назад', '3 дн. назад', '21 дн. назад', '2 дн. назад']) },
];
