import type { ReportSummary, ReportsGateway } from '../data/reports';
import { demoReportPlatforms } from './reportDiversity';

// Documented search examples and the favorite-card instances in Figma 471:1246.
// IDs are local demo identities, not production IDs. Unknown source metadata stays absent.
const reports: readonly ReportSummary[] = [
  { id: 'demo-report-summary', type: 'report', title: 'Сводный отчёт Гостеприимства', domain: 'Гостеприимство', platform: 'Visiology', masterSystem: 'Домиленд', verification: { status: 'verified', reviewer: 'Губина Екатерина Игоревна' } },
  { id: 'demo-report-motivation', type: 'report', title: 'Отчёт о мотивации сотрудников', cardTitle: 'Мотивация сотрудников', domain: 'Гостеприимство', platform: 'Visiology', masterSystem: 'Домиленд', verification: { status: 'verified', reviewer: 'Губина Екатерина Игоревна' } },
  { id: 'demo-report-debt', type: 'report', title: 'Отчёт по дебиторской задолженности', cardTitle: 'Дебиторская задолженность', domain: 'Гостеприимство', platform: 'Visiology', masterSystem: '1С ЖКХ', verification: { status: 'verified', reviewer: 'Губина Екатерина Игоревна' } },
  { id: 'demo-report-management', type: 'report', title: 'Отчёт УК Москва/СПБ', cardTitle: 'УК Москва/СПБ', domain: 'Гостеприимство', platform: 'Visiology', masterSystem: 'Домиленд', verification: { status: 'verified', reviewer: 'Губина Екатерина Игоревна' } },
  // Card display/verification is preserved; metadata was confirmed in FavoriteTable633:11495.
  { id: 'demo-report-occupancy', type: 'report', title: 'Динамика заселения', domain: 'Гостеприимство · демо', domainGroup: 'Гостеприимство', platform: 'Visiology', masterSystem: 'Домиленд', verification: { status: 'unverified' } },
  { id: 'demo-report-client-service', type: 'report', title: 'Качество клиентского сервиса', domain: 'Клиентский сервис · демо', domainGroup: 'Клиентский сервис', platform: 'Visiology', masterSystem: 'Service Desk', verification: { status: 'unverified' } },
  { id: 'demo-report-sales-funnel', type: 'report', title: 'Воронка продаж', domain: 'Продажи и маркетинг · демо', domainGroup: 'Продажи и маркетинг', platform: 'Visiology', masterSystem: 'CRM Dynamics', verification: { status: 'unverified' } },
  { id: 'demo-report-construction', type: 'report', title: 'Статус строительных проектов', domain: 'Строительство · демо', domainGroup: 'Строительство', verification: { status: 'unverified' } },
  { id: 'demo-report-team-workload', type: 'report', title: 'Загрузка команды', domain: 'Управление персоналом · демо', domainGroup: 'Управление персоналом', verification: { status: 'unverified' } },
  { id: 'demo-report-finance-plan', type: 'report', title: 'Выполнение плана поступлений', domain: 'Финансы · демо', domainGroup: 'Финансы', platform: 'Visiology', masterSystem: '1С ERP', verification: { status: 'unverified' } },
  // Catalog527:13683: source-only report, now shared by both catalog views and search.
  // Its verification is shown; the source provides no reviewer name.
  { id: 'demo-report-sales-plan', type: 'report', title: 'План-Факт продажи', domain: 'Продажи и маркетинг', platform: 'Visiology', masterSystem: 'CRM (CRM Dynamics)', verification: { status: 'verified', reviewer: '—' } },
];

export const demoReportsGateway: ReportsGateway = {
  async list(signal) {
    signal?.throwIfAborted();
    return reports.map((report) => ({ ...report, platform:demoReportPlatforms[report.id] ?? report.platform }));
  },
};
