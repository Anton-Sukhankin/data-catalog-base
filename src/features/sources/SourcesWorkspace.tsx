import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { FilterButton } from '../../components/FilterButton/FilterButton';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { SegmentedControl, ViewPicker } from '../../components/HomeControls/HomeControls';
import { transitionCatalog } from '../../components/catalogTransition';
import type { DetailCrumb } from '../../components/DetailHeader/DetailBreadcrumbs';
import { ListPagination } from '../../components/ListPagination/ListPagination';
import { readSourceCatalogView, sourceCatalogPage, sourceFilterCount, writeSourceFilters, type SourceAttribute, type SourceFilters, type SourceSummary, type SourcesGateway } from '../../data/sources';
import { readSourceDetailTab, type SourceDetailsGateway } from '../../data/sourceDetails';
import { demoSourceDetailsGateway } from '../../demo/sourceDetails';
import { demoMasterSystems, type MasterSystem } from '../../demo/masterSystems';
import { SourceDetail, type SourceRelatedNavigation, type SourceDetailSummary } from './detail/SourceDetail';
import { SourceNotice } from './SourceActions';
import type { ReportDetailSources } from '../report-detail/source';
import { demoSourcesGateway } from '../../demo/sources';
import { SourceCards, SourceTable } from './SourceCatalog';
import { useSourceFilterOverlay } from './SourceFilters';
import { SourceTree } from './SourceTree';
import { MasterSystems, MasterSystemSearch } from './MasterSystems';
import s from './Sources.module.css';

const treeGroupParam = 'sourceTreeGroup';
const treeClosedParam = 'sourceTreeClosed';
const masterSectionParam = 'sourceSection';
const masterSystemParam = 'sourceMaster';

export function SourcesWorkspace({gateway=demoSourcesGateway,detailsGateway=demoSourceDetailsGateway,reportDetails,onModalChange,searchTarget,breadcrumbs,relatedNavigation}:{gateway?:SourcesGateway;detailsGateway?:SourceDetailsGateway;reportDetails?:Pick<ReportDetailSources,'read'>;onModalChange:(open:boolean)=>void;searchTarget?:string;breadcrumbs?:readonly DetailCrumb[];relatedNavigation?:SourceRelatedNavigation}) {
  const [params,setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice,setNotice] = useState<string>();
  const [treeBookmarks,setTreeBookmarks] = useState<ReadonlySet<string>>(()=>new Set());
  const [masterQuery, setMasterQuery] = useState('');
  const [closedMasterGroups, setClosedMasterGroups] = useState<readonly string[]>([]);
  const [closedSearchGroups, setClosedSearchGroups] = useState<readonly string[]>([]);
  const masterSearchInput = useRef<HTMLInputElement>(null);
  const masterReturnSearch = useRef<string>(undefined);
  const catalogRecords = gateway.list();
  const activeSection = !searchTarget && params.get(masterSectionParam) === 'master' ? 'master' : 'sources';
  const scopedMaster = activeSection === 'sources' && !searchTarget
    ? demoMasterSystems.find(system => system.id === params.get(masterSystemParam)) : undefined;
  const records = scopedMaster ? catalogRecords.filter(row => row.masterSystem === scopedMaster.name) : catalogRecords;
  const selectedId = params.get('source');
  const reportId = params.get('sourceReport');
  const reportSource = reportId ? reportDetails?.read(reportId)?.sources?.find(source=>source.id===selectedId) : undefined;
  const catalogSource = !reportId || reportSource?.category === 'catalog' ? catalogRecords.find(row=>row.id===selectedId) : undefined;
  const selected: SourceDetailSummary | undefined = catalogSource ?? (reportSource ? {
    id: reportSource.id,
    technicalName: reportSource.name,
    platform: reportSource.platform,
    storageContext: [reportSource.database, reportSource.schema, reportSource.environment].filter(Boolean).join(' · '),
    columns: reportSource.fieldCount,
    technicalStatus: reportSource.status,
    urn: reportSource.urn,
  } : undefined);
  const view = readSourceCatalogView(params.get('sourceView'));
  const { applied, rows, filteredRows, total, pageIndex: page, pageSize, outside } = sourceCatalogPage(records, params, view === 'tree' ? undefined : searchTarget);
  const visible = view === 'tree' ? filteredRows : rows;
  function apply(filters:SourceFilters) {
    setParams(previous=>{
      const next=writeSourceFilters(previous,filters);
      next.delete(treeGroupParam);
      next.delete(treeClosedParam);
      return next;
    });
  }
  const controller = useSourceFilterOverlay({records,applied,onApply:apply,onModalChange});
  useLayoutEffect(()=>{controller.close();setNotice(undefined);},[location.key]);
  function changeMasterQuery(query: string) {
    setMasterQuery(query);
    setClosedSearchGroups([]);
  }
  function clearMasterQuery() {
    changeMasterQuery('');
    masterSearchInput.current?.focus();
  }
  function toggleMasterGroup(label: string) {
    const setClosed = masterQuery.trim() ? setClosedSearchGroups : setClosedMasterGroups;
    setClosed(previous => previous.includes(label) ? previous.filter(value => value !== label) : [...previous, label]);
  }
  function returnToMasterSystems() {
    controller.close();
    if ((location.state as { fromMasterSystems?: boolean } | null)?.fromMasterSystems) {
      navigate(-1);
      return;
    }
    setParams(previous => {
      const next = masterReturnSearch.current === undefined
        ? writeSourceFilters(previous, {}) : new URLSearchParams(masterReturnSearch.current);
      next.delete(masterSystemParam);
      next.set(masterSectionParam, 'master');
      return next;
    }, { replace: true });
  }
  function changeSection(value: string) {
    if (value === activeSection) return;
    if (value === 'master' && scopedMaster) {
      returnToMasterSystems();
      return;
    }
    controller.close();
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.delete(masterSystemParam);
      if (value === 'master') next.set(masterSectionParam, 'master');
      else next.delete(masterSectionParam);
      return next;
    }, { replace: Boolean(searchTarget) });
  }
  function openMasterSystem(system: MasterSystem) {
    masterReturnSearch.current = params.toString();
    controller.close();
    transitionCatalog(() => setParams(previous => {
      const next = writeSourceFilters(previous, {});
      next.delete(treeGroupParam);
      next.delete(treeClosedParam);
      next.delete(masterSectionParam);
      next.set(masterSystemParam, system.id);
      return next;
    }, { state: { fromMasterSystems: true } }));
  }
  function clear(attributes?:readonly SourceAttribute[]) { const next = attributes ? {...applied} : {}; if (attributes) for (const id of attributes) delete next[id]; apply(next); }
  function openSource(row:SourceSummary, treeBranch?:string) {
    controller.close();
    const origin=new URLSearchParams(params);
    if(treeBranch)origin.set(treeGroupParam,treeBranch);
    const sourceReturnTo=location.pathname+(treeBranch?'?'+origin.toString():location.search);
    transitionCatalog(() => setParams(previous=>{
      const next=new URLSearchParams(previous);
      if(treeBranch)next.set(treeGroupParam,treeBranch);
      next.set('source',row.id);
      next.set('sourceTab','fields');
      return next;
    },{state:{sourceReturnTo}}));
  }
  function updateTree(active:string, closed:readonly string[]) {
    setParams(previous=>{
      const next=new URLSearchParams(previous);
      next.set(treeGroupParam,active);
      next.delete(treeClosedParam);
      for(const key of closed)next.append(treeClosedParam,key);
      return next;
    },{replace:true,state:location.state});
  }
  function toggleTreeBookmark(id:string) {
    setTreeBookmarks(previous=>{
      const next=new Set(previous);
      if(next.has(id))next.delete(id);else next.add(id);
      return next;
    });
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
  if(selectedId) return selected ? <SourceDetail key={selected.id} source={selected} detail={catalogSource && detailsGateway.read(catalogSource.id)} tab={readSourceDetailTab(params.get('sourceTab'))} backLabel={backLabel} breadcrumbs={breadcrumbs} relatedNavigation={relatedNavigation}
    onTabChange={value=>transitionCatalog(() => setParams(previous=>{const next=new URLSearchParams(previous);next.set('sourceTab',value);return next;},{replace:true,state:location.state}), 'tab')} onBack={back}/>
    : <section className={s.empty}><h1>Источник не найден</h1><p>Объект отсутствует в доступном наборе.</p><button type="button" onClick={back}>{backLabel ?? 'К источникам'}</button></section>;
  return <section className={s.workspace} aria-label="Каталог источников" data-sources-workspace>
    <h1 className={s.pageTitle}>Источники</h1>
    <div className={s.toolbar} data-source-toolbar data-master-toolbar={activeSection === 'master' || undefined}>
      <SegmentedControl selection={{ariaLabel:'Тип каталога источников',items:[{id:'sources',label:'Источники'},{id:'master',label:'Мастер-системы'}],selectedId:activeSection,onChange:changeSection}}/>
      {activeSection === 'master' && <MasterSystemSearch query={masterQuery} onChange={changeMasterQuery}
        onClear={clearMasterQuery} inputRef={masterSearchInput} />}
      {activeSection === 'sources' && records.length > 0 && <div className={s.tools}>
        {sourceFilterCount(applied)>0 && <button type="button" className={s.reset} onClick={()=>clear()}>Сбросить</button>}
        {visible.length > 0 && <ViewPicker includeTree selection={{value:view,onChange:value=>{controller.close();setParams(previous=>{const next=new URLSearchParams(previous);next.set('sourceView',value);return next;});}}}/>}
        <FilterButton label="Открыть фильтры источников" count={sourceFilterCount(applied)} onOpen={event=>controller.openPanel(event.currentTarget)} onClear={()=>clear()}/>
      </div>}
    </div>
    {scopedMaster && <div className={s.masterScope}>
      <span>Мастер-система: <strong>{scopedMaster.name}</strong></span>
      <button type="button" className={s.reset} onClick={returnToMasterSystems}>К мастер-системам</button>
    </div>}
    {activeSection === 'sources' && outside && <p className={s.searchContext} role="status">Найденный источник показан вне текущих фильтров списка.</p>}
    {activeSection === 'master' ? <MasterSystems query={masterQuery} closed={masterQuery.trim() ? closedSearchGroups : closedMasterGroups}
      onToggle={toggleMasterGroup} onOpen={openMasterSystem} onClear={clearMasterQuery} /> : <div className={s.results} data-catalog-view-results data-list-scroll-boundary>
      {!records.length ? <EmptyState className={s.emptyResults} title="Источников пока нет" description={scopedMaster
        ? 'В наборе прототипа нет источников, связанных с этой мастер-системой.' : 'Здесь будут отображаться доступные источники данных.'} />
        : !visible.length ? <EmptyState className={s.emptyResults} role="status" title="Источники не найдены" description="Измените условия или сбросьте фильтры."
          action={{ label: 'Сбросить фильтры', variant: 'filter-reset', onClick: () => clear() }} />
        : view === 'tree' ? <SourceTree rows={visible} activeKey={params.get(treeGroupParam)} closedKeys={params.getAll(treeClosedParam)}
          bookmarks={treeBookmarks} onBookmark={toggleTreeBookmark} onChange={updateTree} onOpen={openSource} />
        : view === 'list' ? <SourceTable key={page} rows={visible} filters={applied} activeColumn={controller.activeColumn} onColumn={controller.openColumn} onClear={clear} onOpen={openSource} onNotice={setNotice}/>
        : <div key={page} className={s.cardScroll} data-source-card-scroll data-list-scroll><SourceCards rows={visible} onOpen={openSource} onNotice={setNotice}/></div>}
      {view !== 'tree' && total > pageSize && <div className={s.pagination} data-source-pagination>
        <ListPagination total={total} pageIndex={page} pageSize={pageSize} label="Страницы источников" onPageChange={value=>{controller.close();setParams(previous=>{const next=new URLSearchParams(previous);next.set('sourcePage',String(value));return next;});}}/>
      </div>}
    </div>}
    {controller.overlay}
    {notice && <SourceNotice message={notice} onClose={()=>setNotice(undefined)}/>}
  </section>;
}
