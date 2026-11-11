import type { ReportTableRow } from '../data/reportTable';
import type { ReportSummary } from '../data/reports';
import { demoDictionaryGateway } from './dictionary';
import { demoMetricsGateway } from './metrics';
import { demoSourcesGateway } from './sources';
import { demoSourceDetailsGateway } from './sourceDetails';
import { demoSystemReferencesGateway } from './systemReferences';
import { demoReportDetailSources } from '../features/report-detail/demoSource';

export const paginationDemoParam = 'paginationDemo';
const exampleMarker = '--pagination-demo-';
export const paginationExampleCount = 35;

export function paginationExamples<T extends { id: string }>(
  items: readonly T[], rename: (item: T, number: number) => Partial<NoInfer<T>>,
): readonly T[] {
  if (!items.length || items.length >= paginationExampleCount) return items;
  return [...items, ...Array.from({ length: paginationExampleCount - items.length }, (_, offset) => {
    const item = items[offset % items.length];
    const number = items.length + offset + 1;
    return { ...item, ...rename(item, number), id: item.id + exampleMarker + number };
  })];
}

export function paginationExampleLabel(label: string, number: number) {
  return `${label} · демо ${number}`;
}

function originId(id: string) {
  return id.split(exampleMarker)[0];
}

export function paginationReport(id: string, source: ReportSummary): ReportSummary {
  const number = Number(id.split(exampleMarker)[1]);
  return number ? { ...source, id, title: paginationExampleLabel(source.title, number),
    cardTitle: paginationExampleLabel(source.cardTitle ?? source.title, number) } : source;
}

export function paginationReportRows(items: readonly ReportTableRow[]) {
  return paginationExamples(items, (row, number) => {
    const id = row.id + exampleMarker + number;
    return { title: paginationExampleLabel(row.title, number), report: paginationReport(id, row.report) };
  });
}

export function readPaginationReport(id: string, reports: readonly ReportSummary[]) {
  const original = originId(id);
  if (id === original) return;
  const report = reports.find(item => item.id === original);
  return report && paginationReport(id, report);
}

export const paginationReportDetails = {
  ...demoReportDetailSources,
  mailings: {
    ...demoReportDetailSources.mailings,
    manual: (id: string) => demoReportDetailSources.mailings.manual?.(originId(id)),
  },
  read(id: string) {
    const detail = demoReportDetailSources.read(originId(id));
    return detail && id !== originId(id) ? { ...detail, catalogId: undefined, demonstration: true } : detail;
  },
};

const metrics = paginationExamples(demoMetricsGateway.list(), (item, number) => ({ title: paginationExampleLabel(item.title, number) }));
export const paginationMetricsGateway = {
  list: () => metrics,
  read: (id: string) => metrics.find(item => item.id === id) ?? demoMetricsGateway.read(id),
  readDetail(id: string) {
    const detail = demoMetricsGateway.readDetail(originId(id));
    return detail && { ...detail, metricId: id };
  },
};

const sources = paginationExamples(demoSourcesGateway.list(), (item, number) => ({
  technicalName: `${item.technicalName}_demo_${number}`, provenance: 'demo' as const,
}));
export const paginationSourcesGateway = { list: () => sources };
export const paginationSourceDetailsGateway = {
  read(id: string) {
    const detail = demoSourceDetailsGateway.read(originId(id));
    return detail && { ...detail, sourceId: id };
  },
};

const dictionary = demoDictionaryGateway.read();
export const paginationDictionaryGateway = {
  read: () => ({ ...dictionary, terms: paginationExamples(dictionary.terms, (item, number) => ({ name: paginationExampleLabel(item.name, number) })) }),
};

const references = paginationExamples(demoSystemReferencesGateway.list(), (item, number) => ({
  title: paginationExampleLabel(item.title, number), label: paginationExampleLabel(item.label, number),
}));
export const paginationReferencesGateway = {
  list: () => references,
  rows: (id: string) => paginationExamples(demoSystemReferencesGateway.rows(originId(id)), (item, number) => ({
    attribute: { name: paginationExampleLabel(item.attribute.name, number), logicalName: `${item.attribute.logicalName}_demo_${number}` },
  })),
};
