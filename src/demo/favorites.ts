import type { ReportTableRow } from '../data/reportTable';
import { demoReportsGateway } from './reports';
import { demoReportUsage } from './reportDiversity';

type FavoriteTableValues = Omit<ReportTableRow, 'id' | 'report' | 'domain' | 'verifiedIndicator'>;

// Exact displayed values/resources from FavoriteTable633:11495, including clipped rows.
// Cards own identity, domain and verification; table values add display-only attributes.
// Literal — values and independent red warnings are source fixtures, not calculations.
const favoriteValues: ReadonlyMap<string, FavoriteTableValues> = new Map([
  // Source row 1084:28759
  ['demo-report-summary', {
    title: 'Сводный отчёт Гостеприимства',
    mau: '146',
    delta: '+421%',
    chartSrc: '/images/report-table/chart-summary.svg',
    platform: 'Visiology',
    masterSystem: 'Домиленд',
    owner: 'Ручнов Константин Михайлович',
    avatarSrc: '/images/favorites/avatar-summary.png',
    lastViewed: '1 дн. назад',
    warningIndicator: true,
  }],
  // Source row 1084:28800
  ['demo-report-motivation', {
    title: 'Мотивация сотрудников',
    mau: '91',
    delta: '+379%',
    chartSrc: '/images/favorites/chart-motivation.svg',
    platform: 'Visiology',
    masterSystem: 'Домиленд',
    owner: 'Соколова Анна Сергеевна',
    avatarSrc: '/images/favorites/avatar-motivation.png',
    lastViewed: '1 дн. назад',
    warningIndicator: true,
  }],
  // Source row 1084:28843
  ['demo-report-debt', {
    title: 'Отчет по дебиторской задолженности',
    mau: '31',
    delta: '+675%',
    chartSrc: '/images/favorites/chart-debt.svg',
    platform: 'Visiology',
    masterSystem: '1С ЖКХ',
    owner: 'Морозов Павел Андреевич',
    avatarSrc: '/images/favorites/avatar-debt.png',
    lastViewed: '1 дн. назад',
    warningIndicator: false,
  }],
  // Source row 1084:28884
  ['demo-report-management', {
    title: 'УК Москва/СПБ',
    mau: '30',
    delta: '+275%',
    chartSrc: '/images/favorites/chart-management.svg',
    platform: 'Visiology',
    masterSystem: 'Домиленд',
    owner: 'Орлова Мария Дмитриевна',
    avatarSrc: '/images/favorites/avatar-placeholder.svg',
    lastViewed: '1 дн. назад',
    warningIndicator: true,
  }],
  // Source row 1084:28927
  ['demo-report-occupancy', {
    title: 'Динамика заселения',
    mau: '124',
    delta: '+18%',
    chartSrc: '/images/favorites/chart-occupancy.svg',
    platform: 'Visiology',
    masterSystem: 'Домиленд',
    owner: 'Ручнов Константин Михайлович',
    avatarSrc: '/images/favorites/avatar-shared.png',
    lastViewed: '12 дн. назад',
    warningIndicator: true,
  }],
  // Source row 1084:29007
  ['demo-report-client-service', {
    title: 'Качество клиентского сервиса',
    mau: '58',
    delta: '+24%',
    chartSrc: '/images/favorites/chart-client-service.svg',
    platform: 'Visiology',
    masterSystem: 'Service Desk',
    owner: 'Губина Екатерина Игоревна',
    avatarSrc: '/images/favorites/avatar-placeholder-client-service.svg',
    lastViewed: '21 дн. назад',
    warningIndicator: true,
  }],
  // Source row 1084:28968
  ['demo-report-sales-funnel', {
    title: 'Воронка продаж',
    mau: '76',
    delta: '−12%',
    chartSrc: '/images/favorites/chart-sales-funnel.svg',
    platform: 'Visiology',
    masterSystem: 'CRM Dynamics',
    owner: 'Соколова Анна Сергеевна',
    avatarSrc: '/images/favorites/avatar-shared.png',
    lastViewed: '3 дн. назад',
    warningIndicator: false,
  }],
  // Source row 1084:29050
  ['demo-report-finance-plan', {
    title: 'Выполнение плана поступлений',
    mau: '203',
    delta: '+32%',
    chartSrc: '/images/favorites/chart-finance-plan.svg',
    platform: 'Visiology',
    masterSystem: '1С ERP',
    owner: 'Ручнов Константин Михайлович',
    avatarSrc: '/images/favorites/avatar-shared.png',
    lastViewed: '2 дн. назад',
    warningIndicator: true,
  }],
  // Source row 1084:29091
  ['demo-report-construction', {
    title: 'Статус строительных проектов',
    mau: '—',
    delta: '—',
    chartSrc: '/images/report-table/chart-summary.svg',
    platform: '—',
    masterSystem: '—',
    owner: 'Морозов Павел Андреевич',
    avatarSrc: '/images/favorites/avatar-shared.png',
    lastViewed: '—',
    warningIndicator: true,
  }],
  // Source row 1084:29132
  ['demo-report-team-workload', {
    title: 'Загрузка команды',
    mau: '—',
    delta: '—',
    chartSrc: '/images/report-table/chart-summary.svg',
    platform: '—',
    masterSystem: '—',
    owner: 'Орлова Мария Дмитриевна',
    avatarSrc: '/images/favorites/avatar-shared.png',
    lastViewed: '—',
    warningIndicator: true,
  }],
]);

export const demoFavoriteTitles: ReadonlyMap<string, string> = new Map(
  [...favoriteValues].map(([id, value]) => [id, value.title]),
);

export async function readDemoFavoriteRows(signal?: AbortSignal): Promise<ReportTableRow[]> {
  signal?.throwIfAborted();
  const reports = await demoReportsGateway.list(signal);
  signal?.throwIfAborted();

  return reports.flatMap((report) => {
    const values = favoriteValues.get(report.id);
    if (!values) return [];

    return [{
      ...values,
      ...demoReportUsage[report.id],
      platform:report.platform ?? '—',
      id: report.id,
      report,
      domain: report.domainGroup ?? report.domain,
      verifiedIndicator: report.verification?.status === 'verified',
    }];
  });
}
