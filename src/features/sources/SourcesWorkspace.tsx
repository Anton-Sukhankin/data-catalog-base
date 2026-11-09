import { useLayoutEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { FilterButton } from '../../components/FilterButton/FilterButton';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { SegmentedControl, ViewPicker } from '../../components/HomeControls/HomeControls';
import { transitionCatalog } from '../../components/catalogTransition';
import type { DetailCrumb } from '../../components/DetailHeader/DetailBreadcrumbs';
import { ListPagination } from '../../components/ListPagination/ListPagination';
import { sourceCatalogPage, sourceFilterCount, writeSourceFilters, type SourceAttribute, type SourceFilters, type SourceSummary, type SourcesGateway } from '../../data/sources';
import type { SourceDetailsGateway } from '../../data/sourceDetails';
import { demoSourceDetailsGateway } from '../../demo/sourceDetails';
import { SourceDetail, type SourceDetailSummary } from './detail/SourceDetail';
import type { ReportDetailSources } from '../report-detail/source';
import { demoSourcesGateway } from '../../demo/sources';
import { SourceCards, SourceTable } from './SourceCatalog';
import { useSourceFilterOverlay } from './SourceFilters';
import s from './Sources.module.css';

export function SourcesWorkspace({gateway=demoSourcesGateway,detailsGateway=demoSourceDetailsGateway,reportDetails,onModalChange,searchTarget,breadcrumbs}:{gateway?:SourcesGateway;detailsGateway?:SourceDetailsGateway;reportDetails?:Pick<ReportDetailSources,'read'>;onModalChange:(open:boolean)=>void;searchTarget?:string;breadcrumbs?:readonly DetailCrumb[]}) {
  const [params,setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [section,setSection] = useState('sources');
  const records = gateway.list();
  const selectedId = params.get('source');
  const reportId = params.get('sourceReport');
  const reportSource = reportId ? reportDetails?.read(reportId)?.sources.find(source=>source.id===selectedId) : undefined;
  const catalogSource = reportId ? undefined : records.find(row=>row.id===selectedId);
  const selected: SourceDetailSummary | undefined = reportSource ? {
    id: reportSource.id,
    technicalName: reportSource.name,
    platform: reportSource.platform,
    storageContext: [reportSource.database, reportSource.schema, reportSource.environment].filter(Boolean).join(' · '),
    columns: reportSource.fieldCount,
    technicalStatus: reportSource.status,
    urn: reportSource.urn,
  } : catalogSource;
  const view = params.get('sourceView') === 'cards' ? 'cards' : 'list';
  const { applied, rows: visible, total, pageIndex: page, pageSize, outside } = sourceCatalogPage(records, params, searchTarget);
  const activeSection = searchTarget ? 'sources' : section;
  function apply(filters:SourceFilters) { setParams(previous=>writeSourceFilters(previous,filters)); }
  const controller = useSourceFilterOverlay({records,applied,onApply:apply,onModalChange});
  useLayoutEffect(()=>{controller.close();},[location.key]);
  function clear(attributes?:readonly SourceAttribute[]) { const next = attributes ? {...applied} : {}; if (attributes) for (const id of attributes) delete next[id]; apply(next); }
  function openSource(row:SourceSummary) {
    controller.close();
    transitionCatalog(() => setParams(previous=>{const next=new URLSearchParams(previous);next.set('source',row.id);next.set('sourceTab','fields');return next;},{state:{sourceReturnTo:location.pathname+location.search}}));
  }
  function back() {
    if (breadcrumbs?.length) {
      breadcrumbs[breadcrumbs.length - 1].onSelect();
      return;
    }
    if (reportId) {
      if ((location.state as {fromReportSource?:boolean}|null)?.fromReportSource) {
        navigate(-1);
      } else {
        const next = new URLSearchParams(params);
        for (const key of ['source','sourceTab','sourceReport']) next.delete(key);
        next.set('section','reports');
        next.set('report',reportId);
        next.set('reportTab','sources');
        transitionCatalog(() => setParams(next,{replace:true}));
      }
      return;
    }
    const returnTo=(location.state as {sourceReturnTo?:string}|null)?.sourceReturnTo;
    transitionCatalog(() => {
      if(returnTo)navigate(returnTo,{replace:true,state:(location.state as {searchSelection?:unknown}|null)?.searchSelection ? {restoreCatalogSearch:true} : undefined});
      else setParams(previous=>{const next=new URLSearchParams(previous);next.delete('source');next.delete('sourceTab');return next;},{replace:true});
    });
  }
  const backLabel = reportId ? 'Источники данных отчёта' : undefined;
  if(selectedId) return selected ? <SourceDetail key={selected.id} source={selected} detail={catalogSource && detailsGateway.read(catalogSource.id)} tab={params.get('sourceTab')==='reports'?'reports':'fields'} backLabel={backLabel} breadcrumbs={breadcrumbs}
    onTabChange={value=>transitionCatalog(() => setParams(previous=>{const next=new URLSearchParams(previous);next.set('sourceTab',value);return next;},{replace:true,state:location.state}), 'tab')} onBack={back}/>
    : <section className={s.empty}><h1>Источник не найден</h1><p>Объект отсутствует в доступном наборе.</p><button type="button" onClick={back}>{backLabel ?? 'К источникам'}</button></section>;
  return <section className={s.workspace} aria-label="Каталог источников" data-sources-workspace>
    <h1 className={s.pageTitle}>Источники</h1>
    <div className={s.toolbar} data-source-toolbar>
      <SegmentedControl selection={{ariaLabel:'Тип каталога источников',items:[{id:'sources',label:'Источники'},{id:'master',label:'Мастер-системы'}],selectedId:activeSection,onChange:value=>{controller.close();setSection(value);if(searchTarget)setParams(params,{replace:true});}}}/>
      {activeSection === 'sources' && records.length > 0 && <div className={s.tools}>
        {sourceFilterCount(applied)>0 && <button type="button" className={s.reset} onClick={()=>clear()}>Сбросить</button>}
        {visible.length > 0 && <ViewPicker selection={{value:view,onChange:value=>{controller.close();setParams(previous=>{const next=new URLSearchParams(previous);next.set('sourceView',value);return next;});}}}/>}
        <FilterButton label="Открыть фильтры источников" count={sourceFilterCount(applied)} onOpen={event=>controller.openPanel(event.currentTarget)} onClear={()=>clear()}/>
      </div>}
    </div>
    {outside && <p className={s.searchContext} role="status">Найденный источник показан вне текущих фильтров списка.</p>}
    {activeSection === 'master' ? <EmptyState className={s.emptyResults} title="Мастер-системы недоступны" description="Каталог мастер-систем пока недоступен в прототипе."
      action={{ label: 'К источникам', onClick: () => setSection('sources') }} /> : <div className={s.results} data-catalog-view-results data-list-scroll-boundary>
      {!records.length ? <EmptyState className={s.emptyResults} title="Источников пока нет" description="Здесь будут отображаться доступные источники данных." />
        : !visible.length ? <EmptyState className={s.emptyResults} role="status" title="Источники не найдены" description="Измените условия или сбросьте фильтры."
          action={{ label: 'Сбросить фильтры', variant: 'filter-reset', onClick: () => clear() }} />
        : view === 'list' ? <SourceTable key={page} rows={visible} filters={applied} activeColumn={controller.activeColumn} onColumn={controller.openColumn} onClear={clear} onOpen={openSource}/> : <div key={page} className={s.cardScroll} data-source-card-scroll data-list-scroll><SourceCards rows={visible} onOpen={openSource}/></div>}
      {total > pageSize && <div className={s.pagination} data-source-pagination>
        <ListPagination total={total} pageIndex={page} pageSize={pageSize} label="Страницы источников" onPageChange={value=>{controller.close();setParams(previous=>{const next=new URLSearchParams(previous);next.set('sourcePage',String(value));return next;});}}/>
      </div>}
    </div>}
    {controller.overlay}
  </section>;
}
