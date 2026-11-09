import type { MetricSummary, MetricsGateway } from '../data/metrics';
import { createDemoMetricProfiles } from './metricDetails';

// Nine rows from Figma 794:14896, approved for both catalog views on 3 November.
// The two visually identical revenues retain separate local keys.
export const metricCatalogFixture: readonly MetricSummary[] = [
  {
    "id": "metric-ebitda",
    "title": "EBITDA",
    "description": "Операционная прибыльность до процентов, налогов и амортизации",
    "type": "Метрика",
    "status": "Черновик",
    "domain": "Финансы",
    "unit": "Рубли",
    "updated": "09.07.2026"
  },
  {
    "id": "indicator-request-quality",
    "title": "Качество классификации обращений",
    "description": "Качество классификации обращений = Количество корректных заявок из аудита / Общее количество проверенных заявок аудитом × 100%",
    "type": "Показатель",
    "status": "Черновик",
    "domain": "Корпоративные сервисы и сопровождение",
    "unit": "%",
    "updated": "24.09.2026"
  },
  {
    "id": "indicator-revenue-1",
    "title": "Выручка",
    "description": "Описание не заполнено.",
    "type": "Показатель",
    "status": "Черновик",
    "domain": "Продажи и маркетинг",
    "unit": "—",
    "updated": "30.07.2026"
  },
  {
    "id": "indicator-revenue-2",
    "title": "Выручка",
    "description": "Описание не заполнено.",
    "type": "Показатель",
    "status": "Черновик",
    "domain": "Продажи и маркетинг",
    "unit": "—",
    "updated": "30.07.2026"
  },
  {
    "id": "indicator-csat",
    "title": "CSAT менеджер",
    "description": "Показатель удовлетворенности клиентов работой менеджера при передаче квартиры. Используется для мониторинга качества клиентского сервиса в процессе заселения.",
    "type": "Показатель",
    "status": "Черновик",
    "domain": "Гостеприимство",
    "unit": "—",
    "updated": "09.07.2026"
  },
  {
    "id": "4",
    "title": "Объём продаж",
    "description": "Продажи на конечного клиента по предметам договоров с учетом расторжений",
    "type": "Показатель",
    "status": "Проверена",
    "domain": "Продажи и маркетинг",
    "unit": "м²",
    "updated": "11.08.2026"
  },
  {
    "id": "indicator-conversion-demo",
    "title": "Конверсия продаж · пример",
    "description": "Демонстрационный показатель доли успешных продаж.",
    "type": "Показатель",
    "status": "Черновик",
    "domain": "Продажи и маркетинг",
    "unit": "%",
    "updated": "—"
  },
  {
    "id": "metric-average-check-demo",
    "title": "Средний чек · пример",
    "description": "Демонстрационная метрика средней суммы продажи.",
    "type": "Метрика",
    "status": "Черновик",
    "domain": "Продажи и маркетинг",
    "unit": "Рубли",
    "updated": "—"
  },
  {
    "id": "indicator-repeat-demo",
    "title": "Повторные обращения · пример",
    "description": "Демонстрационный показатель доли повторных обращений.",
    "type": "Показатель",
    "status": "Черновик",
    "domain": "Гостеприимство",
    "unit": "%",
    "updated": "—"
  }
];

// Explicit canonical identities for report relationships; not title matching.
export const reportMetricIds = [
  "4",
  "sales-volume-plan",
  "sales-volume-base",
  "sales-volume-no-certificates",
  "sales-volume-projects",
  "sales-plan-projects",
  "sales-volume-phases",
  "sales-plan-phases",
  "sales-volume-stages",
  "sales-volume-cumulative"
] as const;
const reportOnlyMetrics: readonly MetricSummary[] = [
  {
    "id": "sales-volume-plan",
    "title": "План объёма продаж",
    "description": "Планы продаж в метрах",
    "type": "Показатель",
    "status": "Проверена",
    "domain": "Продажи и маркетинг",
    "unit": "м²",
    "updated": "11.08.2026"
  },
  {
    "id": "sales-volume-base",
    "title": "Объём продаж без наценки",
    "description": "Продажи по базовой стоимости без дополнительной наценки",
    "type": "Показатель",
    "status": "Проверена",
    "domain": "Продажи и маркетинг",
    "unit": "м²",
    "updated": "11.08.2026"
  },
  {
    "id": "sales-volume-no-certificates",
    "title": "Объём продаж без сертификатов",
    "description": "Продажи без учёта договоров с использованием сертификатов",
    "type": "Показатель",
    "status": "Проверена",
    "domain": "Продажи и маркетинг",
    "unit": "м²",
    "updated": "11.08.2026"
  },
  {
    "id": "sales-volume-projects",
    "title": "Объём продаж по проектам",
    "description": "Продажи в разрезе проектов за выбранный период",
    "type": "Показатель",
    "status": "Проверена",
    "domain": "Продажи и маркетинг",
    "unit": "м²",
    "updated": "11.08.2026"
  },
  {
    "id": "sales-plan-projects",
    "title": "План продаж по проектам",
    "description": "Плановый объём продаж в разрезе проектов",
    "type": "Показатель",
    "status": "Проверена",
    "domain": "Продажи и маркетинг",
    "unit": "м²",
    "updated": "11.08.2026"
  },
  {
    "id": "sales-volume-phases",
    "title": "Объём продаж по очередям",
    "description": "Продажи в разрезе очередей строительства",
    "type": "Показатель",
    "status": "Проверена",
    "domain": "Продажи и маркетинг",
    "unit": "м²",
    "updated": "11.08.2026"
  },
  {
    "id": "sales-plan-phases",
    "title": "План продаж по очередям",
    "description": "Плановый объём продаж в разрезе очередей",
    "type": "Показатель",
    "status": "Проверена",
    "domain": "Продажи и маркетинг",
    "unit": "м²",
    "updated": "11.08.2026"
  },
  {
    "id": "sales-volume-stages",
    "title": "Объём продаж по этапам",
    "description": "Продажи в разрезе этапов реализации проектов",
    "type": "Показатель",
    "status": "Проверена",
    "domain": "Продажи и маркетинг",
    "unit": "м²",
    "updated": "11.08.2026"
  },
  {
    "id": "sales-volume-cumulative",
    "title": "Накопленный объём продаж",
    "description": "Суммарный объём продаж с начала выбранного периода",
    "type": "Показатель",
    "status": "Проверена",
    "domain": "Продажи и маркетинг",
    "unit": "м²",
    "updated": "11.08.2026"
  }
];
const allMetrics = [...metricCatalogFixture, ...reportOnlyMetrics];
const profiles = createDemoMetricProfiles(allMetrics);
export const demoMetricsGateway: MetricsGateway = {
  list: () => metricCatalogFixture,
  read: id => allMetrics.find(item => item.id === id),
  readDetail: id => profiles.get(id),
};
