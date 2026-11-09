import raw from './overview/source.json';
import { reportPassportExamples } from '../../demo/reportPassports';
import { demoMetricsSource } from './metrics/demoSource';
import { demoMailingsSource } from './mailings/source';
import type { ReportDetailContent, ReportDetailSources, ReportOverviewContent } from './source';
import { demoReportUsageSource } from './usage/demoSource';
import { paperSources, paperLineage } from './sources/demoSource';

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
  slides: [
    { title: 'План-Факт. Проекты накопительно', description: 'План и факт по проектам с начала периода.', example: [['Накопленный план', '120 сделок'], ['Накопленный факт', '112 сделок']] },
    { title: 'План-Факт. Без наценки', description: 'Сравнение продаж без учёта наценки.', example: [['План без наценки', '18 млн ₽'], ['Факт без наценки', '17,2 млн ₽']] },
    { title: 'План-Факт. Без сертификатов', description: 'План и факт продаж без учёта сертификатов.', example: [['План', '105 сделок'], ['Факт', '99 сделок']] },
    { title: 'План-Факт. Проекты/Очереди/Этапы накопительно', description: 'Фактические продажи по очередям и этапам с начала периода.', example: [['Первая очередь', '64 сделки'], ['Вторая очередь', '48 сделок']] },
  ],
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
      nodes: sources.map(({ id }, index) => ({ sourceId: id, x: 199.5 + 351 * index, y: 220 })),
      edges: sources.map(({ id }) => ({ sourceId: id })),
    },
    demonstration: true,
  });
}
examples.set('demo-report-summary', summary);

export const demoReportDetailSources: ReportDetailSources = {
  read: id => examples.get(id),
  metrics:demoMetricsSource,
  mailings:demoMailingsSource,
  usage:demoReportUsageSource,
};
