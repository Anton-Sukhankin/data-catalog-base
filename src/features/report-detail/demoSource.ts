import raw from './overview/source.json';
import { reportPassportExamples, summaryReportSlides } from '../../demo/reportPassports';
import { readRelatedSourceReport, reportCrmDateSourceId } from '../../demo/relatedSourceReports';
import { demoSourcesGateway } from '../../demo/sources';
import { technicalReportDetail, technicalReportSummary } from '../../demo/technicalReport';
import { demoMetricsSource } from './metrics/demoSource';
import { demoMailingsSource } from './mailings/source';
import type { ReportDetailContent, ReportDetailSources, ReportOverviewContent } from './source';
import { demoReportUsageSource } from './usage/demoSource';
import { paperSources, paperLineage } from './sources/demoSource';
import { lineageRow } from './sources/lineageGeometry';

const text = (suffix: string) => raw.find(item => item.id.endsWith(suffix))?.text ?? '';
const overview: ReportOverviewContent = {
  description:text('894:25053'),
  businessQuestions:raw.filter(item => /894:251(03|06|09|12|15|18|21|24)$/.test(item.id)).map(item => item.text),
  terms:raw.filter(item => item.id.startsWith('I894:25565;') && item.id.endsWith('279:2069')).map(item => item.text),
  methodology:[text('922:21438'),text('922:21439')], additional:text('922:21441'), context:'Управление качеством сервиса',
  questions:['3144','3147','3150','3153'].map((id,i)=>({title:text('932:'+id),answer:text('932:'+['3145','3148','3151','3154'][i])})),
  refreshSchedule: 'Ежедневно, в 5:00',
  people: [
    { name: 'Губина Екатерина Игоревна', description: '24.07.2026, 15:02 · Бизнес-аналитик', role: 'Проверил', avatar: '/images/report-table/avatar-sales-plan.png' },
    { name: 'Ручнов Константин Михайлович', description: 'Директор по клиентскому сервису', role: 'Владелец', avatar: '/images/report-table/avatar-summary.png' },
    { name: 'Губина Екатерина Игоревна', description: 'Бизнес-аналитик', role: 'Аналитик', avatar: '/images/favorites/avatar-placeholder.svg' },
  ],
};

const summary: ReportDetailContent = {
  catalogId: '562',
  headingNote: 'Стабильный отчёт\u00a0\u00a0\u00a0•\u00a0\u00a0\u00a0Отчет по заявкам Домиленда',
  overview,
  slides: summaryReportSlides,
  sources: paperSources,
  lineage: paperLineage,
};

const examples = new Map<string, ReportDetailContent>();
for (const [reportId, example] of reportPassportExamples) {
  const { sources } = example;
  examples.set(reportId, {
    overview: example.overview,
    slides: example.slides,
    sources,
    lineage: {
      nodes: lineageRow(sources.map(({ id }) => id)),
      edges: sources.map(({ id }) => ({ sourceId: id })),
    },
    demonstration: true,
  });
}
examples.set('demo-report-summary', summary);
examples.set(technicalReportSummary.id, technicalReportDetail);

const calendar = demoSourcesGateway.list().find(source => source.id === reportCrmDateSourceId);

export const demoReportDetailSources: ReportDetailSources = {
  read(id) {
    const existing = examples.get(id);
    if (existing) return existing;
    const report = readRelatedSourceReport(id);
    if (!report || !calendar) return undefined;
    return {
      overview: report.description ? { description: report.description } : undefined,
      sources: [{
        id: calendar.id, name: calendar.technicalName, category: 'catalog',
        platform: calendar.platform, database: calendar.storageContext, fieldCount: calendar.columns,
      }],
      demonstration: true,
    };
  },
  metrics:demoMetricsSource,
  mailings:demoMailingsSource,
  usage:demoReportUsageSource,
};
