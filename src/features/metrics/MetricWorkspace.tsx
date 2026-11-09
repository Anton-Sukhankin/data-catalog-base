import { useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { transitionCatalog } from '../../components/catalogTransition';
import type { DetailCrumb } from '../../components/DetailHeader/DetailBreadcrumbs';
import { readMetricCatalogState, type MetricCatalogState, type MetricSummary, type MetricsGateway } from '../../data/metrics';
import type { QuestionDraft } from '../../data/questions';
import { demoMetricsGateway } from '../../demo/metrics';
import { MetricsCatalog } from './catalog/MetricsCatalog';
import { MetricDetail } from './detail/MetricDetail';
import s from './MetricWorkspace.module.css';

/** URL and source integration; both views remain consumers of the same objects. */
export function MetricWorkspace({ gateway = demoMetricsGateway, breadcrumbs, onOpenRelatedMetric, onOpenReport, searchTarget, onSubmitQuestion }: {
  gateway?: MetricsGateway;
  breadcrumbs?: readonly DetailCrumb[];
  onOpenRelatedMetric?: (id: string) => void;
  onOpenReport?: (id: string) => void;
  searchTarget?: string;
  onSubmitQuestion: (draft: QuestionDraft) => void;
}) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollPositions = useRef<Record<string, number>>({});
  const items = gateway.list();
  const selectedId = params.get('metric');
  const metric = selectedId ? gateway.read(selectedId) : undefined;
  const profile = selectedId ? gateway.readDetail(selectedId) : undefined;
  const state = readMetricCatalogState(items, params);
  const pageIndex = Number(params.get('metricPage'));
  const scrollKey = `${state.view}|${state.type}|${state.status}|${pageIndex}`;
  function changeState(patch: Partial<MetricCatalogState>) {
    const nextState = { ...state, ...patch };
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if ('type' in patch || 'status' in patch) next.delete('metricPage');
      for (const [key, value] of Object.entries({ metricView: nextState.view, metricType: nextState.type, metricStatus: nextState.status })) {
        if (value) next.set(key, value); else next.delete(key);
      }
      return next;
    }, { replace: true });
  }
  function changePage(index: number) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (index) next.set('metricPage', String(index)); else next.delete('metricPage');
      return next;
    }, { replace: true });
  }
  function openMetric(item: MetricSummary) {
    const next = new URLSearchParams(params);
    next.set('section', 'metrics');
    next.set('metric', item.id);
    next.delete('report');
    transitionCatalog(() => setParams(next, { state: { metricReturnTo: location.pathname + location.search } }));
  }
  function back() {
    if (breadcrumbs?.length) breadcrumbs[breadcrumbs.length - 1].onSelect();
    else if ((location.state as { metricReturnTo?: string } | null)?.metricReturnTo) navigate(-1);
    else setParams(previous => { const next = new URLSearchParams(previous); next.delete('metric'); return next; }, { replace: true });
  }
  if (selectedId) return metric && profile?.metricId === metric.id
    ? <MetricDetail key={metric.id} metric={metric} profile={profile} breadcrumbs={breadcrumbs} onOpenMetric={id => {
      const item = gateway.read(id);
      if (!item) return;
      if (onOpenRelatedMetric) onOpenRelatedMetric(id);
      else openMetric(item);
    }} onBack={back} onOpenReport={onOpenReport} onSubmitQuestion={onSubmitQuestion} />
    : <section className={s.unavailable}><h1>Показатель не найден</h1><p>Объекта с таким идентификатором нет в демонстрационном наборе.</p><button type="button" onClick={back}>К списку метрик и показателей</button></section>;
  return <section className={s.workspace} aria-label="Раздел метрик и показателей">
    <h1>Метрики и показатели</h1>
    <MetricsCatalog items={items} state={state} onStateChange={changeState} onOpen={openMetric} searchTarget={searchTarget}
      pageIndex={pageIndex} onPageChange={changePage}
      initialScrollTop={scrollPositions.current[scrollKey] ?? 0} onScroll={top => { scrollPositions.current[scrollKey] = top; }} />
  </section>;
}
