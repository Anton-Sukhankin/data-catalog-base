import type { ReportTableRow } from '../data/reportTable';
import { reportTablePage } from '../data/reportTable';
import { demoReportsGateway } from './reports';
import { demoReportUsage } from './reportDiversity';

// Source: nine displayed table rows in Figma527:13683. Displayed values are fixtures,
// not calculations, API contracts or permission/verification rules.
const values = [
  ['summary','demo-report-summary','Сводный отчёт Гостеприимства','146','+421%','Гостеприимство','Домиленд','Ручнов Константин Михайлович','1 дн. назад',true],
  ['motivation','demo-report-motivation','Мотивация сотрудников','91','+379%','Гостеприимство','Домиленд','Соколова Анна Сергеевна','1 дн. назад',true],
  ['debt','demo-report-debt','Отчет по дебиторской задолженности','31','+675%','Гостеприимство','1С ЖКХ','Морозов Павел Андреевич','1 дн. назад',false],
  ['management','demo-report-management','УК Москва/СПБ','30','+275%','Гостеприимство','Домиленд','Орлова Мария Дмитриевна','1 дн. назад',true],
  ['occupancy','demo-report-occupancy','Динамика заселения','124','+18%','Гостеприимство','Домиленд','Ручнов Константин Михайлович','12 дн. назад',true],
  ['client-service','demo-report-client-service','Качество клиентского сервиса','58','+24%','Клиентский сервис','Service Desk','Губина Екатерина Игоревна','21 дн. назад',true],
  ['sales-plan','demo-report-sales-plan','План-Факт продажи','98','−6%','Продажи и маркетинг','CRM (CRM Dynamics)','Ручнов Константин Михайлович','1 дн. назад',false],
  ['sales-funnel','demo-report-sales-funnel','Воронка продаж','76','−12%','Продажи и маркетинг','CRM Dynamics','Соколова Анна Сергеевна','3 дн. назад',false],
  ['finance-plan','demo-report-finance-plan','Выполнение плана поступлений','203','+32%','Финансы','1С ERP','Ручнов Константин Михайлович','2 дн. назад',true],
] as const;

export const demoCatalogTitles: ReadonlyMap<string, string> = new Map(values.map(([, id, title]) => [id, title]));

export async function readDemoReportRows(signal?: AbortSignal) {
  const reports = await demoReportsGateway.list(signal);
  const byId = new Map(reports.map((report) => [report.id, report]));
  const rows: ReportTableRow[] = values.map(([asset,id,title,mau,delta,domain,masterSystem,owner,lastViewed,warning]) => ({
    id, title, mau, delta, domain, masterSystem, owner, lastViewed,
    // Table display aliases remain on the row; the chosen object's card display
    // and canonical metadata must not be overwritten by those aliases.
    report: byId.get(id) ?? { id, type: 'report' as const, title, domain, platform: 'Visiology', masterSystem },
    platform: byId.get(id)?.platform ?? '—', chartSrc: `/images/report-table/chart-${asset}.svg`,
    ...demoReportUsage[id],
    avatarSrc: `/images/report-table/avatar-${asset}.png`,
    verifiedIndicator: byId.get(id)?.verification ? byId.get(id)!.verification!.status === 'verified' : true,
    warningIndicator: warning,
  }));
  return rows;
}

export async function readDemoReportTable(pageIndex: number, pageSize: number, signal?: AbortSignal) {
  return reportTablePage(await readDemoReportRows(signal), pageIndex, pageSize);
}
