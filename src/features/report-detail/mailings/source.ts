import { reportPassportExamples } from '../../../demo/reportPassports';

export interface ReportMailing {
  id: string;
  name: string;
  subscribed: boolean;
  dateTime: string;
  displayDate: string;
}

export interface MailingsSource {
  list(reportId: string): readonly ReportMailing[] | undefined;
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

/** Report-scoped demo data. Actual subscriptions remain outside the prototype. */
export const demoMailingsSource: MailingsSource = { list: reportId => mailings.get(reportId) };
