import type { MetricsSource, RelatedMetric } from './model';
import { demoMetricsGateway, reportMetricIds } from '../../../demo/metrics';
import { reportPassportExamples } from '../../../demo/reportPassports';

function forReport(reportId: string, ids: readonly string[]): readonly RelatedMetric[] {
  return ids.flatMap((metricId, index) => {
    const metric = demoMetricsGateway.read(metricId);
    if (!metric) return [];
    const formula = demoMetricsGateway.readDetail(metricId)?.sections[2].body;
    return [{ ...metric, id: reportId + ':metric:' + (index + 1), metricId, reportId,
      formula: formula?.kind === 'prose' ? formula.text : undefined }];
  });
}

const records = new Map<string, readonly RelatedMetric[]>(
  Array.from(reportPassportExamples, ([id, example]) => [id, forReport(id, example.metricIds)]),
);
records.set('demo-report-summary', forReport('demo-report-summary', reportMetricIds));
export const demoMetricsSource: MetricsSource = { read: reportId => records.get(reportId) };
