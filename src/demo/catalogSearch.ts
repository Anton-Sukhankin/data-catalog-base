import { searchId, type SearchEntry } from '../data/catalogSearch';
import type { AiSolution } from '../data/aiHub';
import type { FaqEntry, QuestionAppeal } from '../data/questions';
import type { ReportSummary } from '../data/reports';
import type { SystemReference } from '../data/systemReferences';
import { demoDictionaryGateway } from './dictionary';
import { demoFavoriteTitles } from './favorites';
import { demoMetricsGateway } from './metrics';
import { demoCatalogTitles } from './reportTable';
import { demoSourceDetailsGateway } from './sourceDetails';
import { demoSourcesGateway } from './sources';

export function demoReportSearchEntries(reports: readonly ReportSummary[]): SearchEntry[] {
  return reports.map(report => {
    const catalogTitle = demoCatalogTitles.get(report.id);
    const visibleTitle = catalogTitle ?? demoFavoriteTitles.get(report.id);
    return {
      id: searchId('report', report.id),
      kind: 'report',
      title: report.title,
      context: [report.domain, report.platform, report.masterSystem].filter(value => value !== undefined),
      values: [
        { field: 'title', text: report.title },
        ...(visibleTitle && visibleTitle !== report.title ? [{ field: 'title', text: visibleTitle }] : []),
        { field: 'domain', label: 'Домен', text: report.domain },
        { field: 'platform', label: 'Платформа', text: report.platform ?? '' },
        { field: 'masterSystem', label: 'Мастер-система', text: report.masterSystem ?? '' },
      ],
      destination: visibleTitle ? { kind: 'report', section: catalogTitle ? 'reports' : 'home', report } : undefined,
    };
  });
}

export function demoAiSearchEntries(items: readonly AiSolution[]): SearchEntry[] {
  return items.map(item => ({
    id: searchId('ai-solution', item.id),
    kind: 'ai-solution',
    title: item.title,
    context: [item.type, item.domain],
    values: [
      { field: 'title', text: item.title },
      ...(item.detail?.purpose ?? [item.description]).map((text, index) => ({ field: `purpose.${index}`, label: 'Назначение', text })),
    ],
    destination: { kind: 'ai-solution', id: item.id },
  }));
}

export function demoReferenceSearchEntries(items: readonly SystemReference[]): SearchEntry[] {
  return items.map(item => ({
    id: searchId('system-reference', item.id),
    kind: 'system-reference',
    title: item.title,
    context: item.system.code ? [item.system.name, item.system.code] : [item.system.name],
    values: [
      { field: 'title', text: item.title },
      { field: 'system-name', text: item.system.name },
      { field: 'system-code', text: item.system.code ?? '' },
    ],
    destination: { kind: 'system-reference', id: item.id },
  }));
}

export function demoQuestionSearchEntries(faq: readonly FaqEntry[], appeals: readonly QuestionAppeal[]): SearchEntry[] {
  return [
    ...faq.map((item): SearchEntry => ({
      id: searchId('faq', item.id),
      kind: 'faq',
      title: item.question,
      context: ['FAQ'],
      values: [{ field: 'title', text: item.question }, { field: 'answer', label: 'Ответ', text: item.answer }],
      destination: { kind: 'faq', id: item.id },
    })),
    ...appeals.map((item): SearchEntry => ({
      id: searchId('appeal', item.id),
      kind: 'appeal',
      title: item.subject,
      context: ['Мои вопросы'],
      values: [{ field: 'title', text: item.subject }],
      destination: { kind: 'appeal', id: item.id },
    })),
  ];
}

const sources = demoSourcesGateway.list();
const metrics = demoMetricsGateway.list();

const sourceEntries: SearchEntry[] = sources.map(source => ({
  id: searchId('source', source.id),
  kind: 'source',
  title: source.technicalName,
  context: [source.platform, source.domain],
  values: [{ field: 'title', text: source.technicalName }, { field: 'description', label: 'Описание', text: source.description ?? '' }],
  destination: { kind: 'source', id: source.id, hasDetail: Boolean(demoSourceDetailsGateway.read(source.id)) },
}));

const metricEntries: SearchEntry[] = metrics.map(metric => {
  const profile = demoMetricsGateway.readDetail(metric.id);
  const description = metric.description === 'Описание не заполнено.' ? '' : metric.description;
  const definition = profile?.sections[0]?.body;
  const sameName = metrics.some(other => other.id !== metric.id && other.title === metric.title);
  const distinguishingText = description || (definition?.kind === 'prose' ? definition.text : '');
  return {
    id: searchId('metric', metric.id),
    kind: 'metric',
    title: metric.title,
    context: [metric.type, metric.domain, metric.status],
    hint: sameName ? distinguishingText.split('. ')[0] : undefined,
    values: [{ field: 'title', text: metric.title }, { field: 'description', label: 'Описание', text: description }],
    destination: { kind: 'metric', id: metric.id, hasDetail: Boolean(profile) },
  };
});

const fields: SearchEntry[] = sources.flatMap(source =>
  (demoSourceDetailsGateway.read(source.id)?.fields ?? []).map(field => ({
    id: searchId('field', source.id, field.name),
    kind: 'field',
    title: field.name,
    context: [source.technicalName, field.sqlType],
    values: [{ field: 'title', text: field.name }],
    destination: { kind: 'field', sourceId: source.id },
  })),
);

const terms: SearchEntry[] = demoDictionaryGateway.read().terms.map(term => ({
  id: searchId('term', term.id),
  kind: 'term',
  title: term.name,
  context: [term.type, term.status],
  values: [{ field: 'title', text: term.name }, { field: 'description', label: 'Определение', text: term.description }],
  destination: { kind: 'term', termId: term.id },
}));

const domains: SearchEntry[] = demoDictionaryGateway.read().domains.map(domain => ({
  id: searchId('dictionary-domain', domain.id),
  kind: 'dictionary-domain',
  title: domain.name,
  context: [],
  values: [{ field: 'title', text: domain.name }],
  destination: { kind: 'dictionary-domain', domainId: domain.id },
}));

const blocks: SearchEntry[] = metrics.flatMap(metric =>
  (demoMetricsGateway.readDetail(metric.id)?.sections ?? []).flatMap(section => {
    const body = section.body;
    const values = body.kind === 'method'
      ? body.rows.map(([label, text], index) => ({ field: String(index), label, text }))
      : body.kind === 'prose' ? [{ field: 'body', text: body.text }] : [];
    if (!values.length) return [];
    return [{
      id: searchId('metric-block', metric.id, section.id),
      kind: 'metric-block',
      title: metric.title,
      context: [section.title],
      values,
      destination: { kind: 'metric-block', metricId: metric.id, blockId: section.id },
    }];
  }),
);

export const demoAdditionalSearchEntries = [...sourceEntries, ...fields, ...metricEntries, ...terms, ...domains, ...blocks];
