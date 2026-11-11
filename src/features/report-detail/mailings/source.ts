import { reportPassportExamples, summaryReportSlides } from '../../../demo/reportPassports';
import type { ManualDeliveryData } from './deliveryModel';

export interface ReportMailing {
  id: string;
  name: string;
  subscribed: boolean;
  dateTime: string;
  displayDate: string;
}

export interface MailingsSource {
  list(reportId: string): readonly ReportMailing[] | undefined;
  manual?(reportId: string): ManualDeliveryData | undefined;
}

const summaryMailings: readonly ReportMailing[] = [
  { id: 'sales-today', name: 'Мои продажи сегодня', subscribed: true, dateTime: '2026-10-06T09:00:00+03:00', displayDate: '06.10.2026, 09:00:00' },
  { id: 'weekly-status', name: 'Еженедельный статус', subscribed: false, dateTime: '2026-10-06T09:00:00+03:00', displayDate: '06.10.2026, 09:00:00' },
];

const mailings = new Map<string, readonly ReportMailing[]>(Array.from(reportPassportExamples, ([id, example]) => [
  id,
  example.mailingNames.map((name, index) => ({
    id: `${id}:mailing:${index + 1}`, name, subscribed: index === 0,
    dateTime: index === 0 ? '2026-11-05T09:00:00+03:00' : '2026-11-06T10:00:00+03:00',
    displayDate: index === 0 ? '05.11.2026, 09:00:00' : '06.11.2026, 10:00:00',
  })),
]));
mailings.set('demo-report-summary', summaryMailings);

const people = [
  { value: 'anna', label: 'Анна Петрова' },
  { value: 'ivan', label: 'Иван Смирнов' },
  { value: 'maria', label: 'Мария Волкова' },
];
const demoRecipients: ManualDeliveryData['recipients'] = {
  mail: [...people, { value: 'analytics-group', label: 'Группа «Аналитика»' }],
  talkPeople: people,
  talkGroups: [{ value: 'analytics-talk', label: 'Аналитика · отчёты' }],
};

function deliveryForSlides(reportId: string, slides: readonly { title: string }[]): ManualDeliveryData {
  return {
    recipients: demoRecipients,
    sheets: slides.map(({ title }, index) => ({ id: `${reportId}:sheet:${index + 1}`, title })),
  };
}

const salesPlanDelivery: ManualDeliveryData = {
  recipients: {
    mail: [...people, { value: 'sales-group', label: 'Группа «Продажи»' }],
    talkPeople: people,
    talkGroups: [{ value: 'sales-talk', label: 'Продажи · отчёты' }],
  },
  sheets: [
    'План-Факт. Проекты накопительно', 'План-Факт без наценки', 'План-Факт без сертификатов',
    'План-Факт. Проекты/Очереди/Этапы накопительно', 'План-Факт. Регионы накопительно', 'План-Факт. Месяцы',
    'План-Факт. Проекты. Месяцы', 'Продажи по типу отделки', 'Продажи по типу отделки по мес',
    'Типы отделки по ТЭП', 'Доля онлайн-сделок', 'План-Факт. Месяцы БЮ', 'Прогноз за дату',
  ].map((title, index) => ({ id: `sales-plan-sheet-${index + 1}`, title })),
};

const manualDeliveries = new Map(Array.from(reportPassportExamples, ([id, { slides }]) => [
  id, deliveryForSlides(id, slides),
]));
manualDeliveries.set('demo-report-summary', deliveryForSlides('demo-report-summary', summaryReportSlides));
manualDeliveries.set('demo-report-sales-plan', salesPlanDelivery);

/** Report-scoped demo data. Actual subscriptions remain outside the prototype. */
export const demoMailingsSource: MailingsSource = {
  list: reportId => mailings.get(reportId),
  manual: reportId => manualDeliveries.get(reportId),
};
