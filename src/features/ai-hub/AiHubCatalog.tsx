import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import motion from '../../components/Accordion/Accordion.module.css';
import { DetailSecondary } from '../../components/DetailHeader/DetailSecondary';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ListPagination } from '../../components/ListPagination/ListPagination';
import { paginate } from '../../data/pagination';
import { SearchPanelToggle } from '../../components/FilterButton/SearchPanelToggle';
import { FilterButton } from '../../components/FilterButton/FilterButton';
import { SearchField } from '../../components/Search/SearchField';
import { ViewPicker } from '../../components/HomeControls/HomeControls';
import type { AiSolution } from '../../data/aiHub';
import { AiFilterDialog, AiQuickFilters } from './AiFilterDialog';
import { AiSolutionDetail } from './AiSolutionDetail';
import { AiSolutionsTable, SolutionCard } from './AiSolutions';
import { aiFilterCount, aiFilterIds, aiKey as key, aiOptions, emptyAiFilters, readAiFilters, toggleAiValue, writeAiFilters, type AiColumn, type AiFilters, type AiSort } from './aiFilters';
import s from './AiHubCatalog.module.css';

export function AiHubCatalog({items, scrollPosition, bookmarks, onBookmark, onModalChange}:{
  items:readonly AiSolution[]; scrollPosition:RefObject<number>; bookmarks:ReadonlySet<string>;
  onBookmark:(id:string)=>void;
  onModalChange:(open:boolean)=>void;
}) {
  const [params,setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice,setNotice] = useState<string>();
  const [compact,setCompact] = useState(false);
  const [filtersCollapsed,setFiltersCollapsed] = useState(false);
  const [filterOpener,setFilterOpener] = useState<HTMLButtonElement>();
  const restoreFilterFocus = useRef<HTMLButtonElement>(null);
  const filterFieldsId = useId();
  const root = useRef<HTMLElement>(null);
  const lastOpened = useRef<string | undefined>(undefined);
  const tableScroll = useRef<HTMLDivElement>(null);
  const tablePosition = useRef({left:0, top:0});
  const selectedId = params.get(key('solution'));
  const selected = items.find(item=>item.id===selectedId);
  const isDetail = Boolean(selected);
  const view = params.get(key('view')) === 'list' ? 'list' : 'cards';
  useLayoutEffect(() => {
    if (!filterOpener && restoreFilterFocus.current) {
      restoreFilterFocus.current.focus({preventScroll:true});
      restoreFilterFocus.current = null;
    }
  }, [filterOpener]);
  useLayoutEffect(()=>{
    const container = root.current?.closest('main');
    if (!container) return;
    if (isDetail) {
      root.current?.querySelector<HTMLElement>('[data-ai-detail-heading]')?.focus({preventScroll:true});
      return;
    }
    container.scrollTop = scrollPosition.current;
    if (lastOpened.current) {
      root.current?.querySelector<HTMLElement>(`[data-ai-solution="${CSS.escape(lastOpened.current)}"] [data-ai-open]`)?.focus({preventScroll:true});
    }
    const record = () => {
      scrollPosition.current = container.scrollTop;
      setCompact(container.scrollTop > 0);
    };
    record();
    container.addEventListener('scroll',record);
    return () => container.removeEventListener('scroll',record);
  },[isDetail,scrollPosition]);

  const query = params.get(key('query')) ?? '';
  const normalized = query.trim().toLocaleLowerCase('ru');
  const options = useMemo(() => aiOptions(items), [items]);
  const filters = readAiFilters(params, options);
  const [column, direction] = (params.get(key('sort')) ?? '').split(':');
  const sort: AiSort | undefined = (column === 'type' || column === 'domain' || column === 'status') && (direction === 'asc' || direction === 'desc')
    ? {column, direction} : undefined;
  const shown = items.filter(item =>
    aiFilterIds.every(id => !filters.fields[id]?.length || filters.fields[id]?.includes(item[id])) &&
    filters.flags.every(flag=>item.flags.includes(flag)) &&
    [item.title,item.description,item.owner,item.developer].some(value=>value?.toLocaleLowerCase('ru').includes(normalized))
  );
  if (sort) shown.sort((a,b) => a[sort.column].localeCompare(b[sort.column], 'ru') * (sort.direction === 'asc' ? 1 : -1));
  const conditionCount = aiFilterCount(filters);
  const hasFilters = Boolean(query || conditionCount);
  const page = paginate(shown, Number(params.get(key('page'))));
  const update = (id:string,value:string) => {
    const updatesResults = id !== 'solution' && id !== 'view';
    if (updatesResults) {
      tablePosition.current.top = 0;
      tableScroll.current?.scrollTo({top:0});
      if (id === 'page' || page.pageIndex > 0) root.current?.closest('main')?.scrollTo(0, 0);
    }
    setParams(previous=>{
      const next = new URLSearchParams(previous);
      if (updatesResults && id !== 'page') next.delete(key('page'));
      if (value) next.set(key(id),value); else next.delete(key(id));
      return next;
    },{replace:true,state:location.state});
  };
  function applyFilters(filters: AiFilters, nextSort: AiSort | undefined, includeQuery = false) {
    tablePosition.current.top = 0;
    tableScroll.current?.scrollTo({top:0});
    if (page.pageIndex > 0) root.current?.closest('main')?.scrollTo(0,0);
    setParams(previous=>{
      const next = new URLSearchParams(previous);
      next.delete(key('page'));
      if (includeQuery) next.delete(key('query'));
      writeAiFilters(next, filters);
      if (nextSort) next.set(key('sort'), `${nextSort.column}:${nextSort.direction}`);
      else next.delete(key('sort'));
      return next;
    },{replace:true,state:location.state});
  }
  const reset = (includeQuery:boolean) => applyFilters(emptyAiFilters, sort, includeQuery);
  const onColumnChange = (id: AiColumn, values: readonly string[], nextSort?: AiSort) =>
    applyFilters({ ...filters, fields: { ...filters.fields, [id]: values } }, nextSort);

  function openSolution(item:AiSolution) {
    if (item.id===selectedId) return;
    setNotice(undefined);
    if (!isDetail) {
      lastOpened.current = item.id;
      scrollPosition.current = root.current?.closest('main')?.scrollTop ?? 0;
    }
    setParams(previous=>{
      const next = new URLSearchParams(previous);
      next.set(key('solution'),item.id);
      return next;
    },{replace:isDetail,state:isDetail ? location.state : {...location.state, aiFromCatalog:true}});
  }

  function backToCatalog() {
    setNotice(undefined);
    if (location.state?.aiFromCatalog) {
      navigate(-1);
      return;
    }
    update('solution','');
  }
  function notifyUnavailable(item: AiSolution, label: string) {
    setNotice(`«${label}» недоступно в прототипе. Адрес для «${item.title}» не указан.`);
  }

  return <section ref={root} className={s.catalog} aria-label="Каталог AI Hub"
    data-ai-view={isDetail ? 'detail' : 'catalog'} data-detail-compact={!isDetail && compact}
    data-ai-list={!isDetail && view === 'list' && shown.length > 0}
    data-paginated={!isDetail && page.pageCount > 1}>
    <div className={s.chrome}>
      <header className={s.heading}>
        <div className={s.titleRow}>
          <h1>AI Hub</h1>
          {!isDetail && items.length > 0 && <span className={s.resultCount} role="status" aria-label="Количество решений">{shown.length}</span>}
        </div>
        <DetailSecondary compact={!isDetail && compact}><p>Корпоративный каталог ИИ-решений</p></DetailSecondary>
        {!isDetail && items.length > 0 && <div className={s.viewPicker}><ViewPicker selection={{
          value:view, onChange:value=>{ if (value !== view) update('view', value === 'list' ? value : ''); },
        }} /><FilterButton count={conditionCount} label="Открыть фильтры AI Hub"
          onOpen={event=>setFilterOpener(event.currentTarget)} onClear={()=>reset(false)} /></div>}
      </header>
      {items.length > 0 && <div className={s.filters} aria-label="Фильтры AI Hub" role="group">
        <div className={s.searchRow}>
          <div className={s.search}>
            <SearchField aria-label="Поиск по решениям AI Hub" placeholder="Поиск по названию, описанию, владельцу или разработчику"
              value={query} onValueChange={value=>update('query',value)}/>
          </div>
          <SearchPanelToggle panelId={filterFieldsId} visible={!filtersCollapsed} labels={['Свернуть', 'Развернуть']}
            conditionCount={isDetail ? conditionCount : 0} onToggle={()=>setFiltersCollapsed(previous=>!previous)} onClear={()=>reset(false)}/>
        </div>
        <div id={filterFieldsId} className={motion.reveal} data-open={!filtersCollapsed} inert={filtersCollapsed}>
          <div className={s.filterClip}>
            <div className={s.filterFields}>
              <div className={s.filterFooter}>
                <AiQuickFilters active={filters.flags} onToggle={id=>applyFilters({...filters, flags:toggleAiValue(filters.flags,id)}, sort)}/>
                {hasFilters && <button type="button" className={s.reset} onClick={()=>reset(true)}>Сбросить фильтры</button>}
              </div>
            </div>
          </div>
        </div>
      </div>}
    </div>
    {selected ? <AiSolutionDetail item={selected} items={shown} saved={bookmarks.has(selected.id)}
      onBookmark={()=>onBookmark(selected.id)} onSelect={openSolution} onBack={backToCatalog} onNotice={setNotice}/>
    : <div className={s.results} data-ai-results data-detail-tab-content>
    {selectedId && <div className={s.empty} role="status"><p>Решение не найдено. Показан каталог.</p>
      <button type="button" className={s.reset} onClick={()=>update('solution','')}>К каталогу</button>
    </div>}
    {shown.length ? view === 'list' ? <AiSolutionsTable rows={page.rows} bookmarks={bookmarks} onBookmark={onBookmark}
      onUnavailable={notifyUnavailable} onOpen={openSolution} scrollRef={tableScroll} scrollPosition={tablePosition}
      filters={filters} options={options} sort={sort} onColumnChange={onColumnChange} />
    : <div className={s.grid} data-ai-grid data-catalog-view-results>
      {page.rows.map(item=><SolutionCard key={item.id} item={item} saved={bookmarks.has(item.id)} onBookmark={onBookmark}
        onUnavailable={notifyUnavailable} onOpen={openSolution}/>)}
    </div> : items.length
      ? <EmptyState title="Решения не найдены" description="Измените запрос или сбросьте фильтры." />
      : <EmptyState title="ИИ-решений пока нет" description="Здесь будут отображаться доступные решения каталога." />}
    <ListPagination {...page} sticky label="Страницы решений AI Hub" onPageChange={index => update('page', index ? String(index) : '')} />
    </div>}
    {filterOpener && <AiFilterDialog opener={filterOpener} applied={filters} options={options}
      onApply={next=>applyFilters(next, sort)} onModalChange={onModalChange}
      onClose={()=>{restoreFilterFocus.current = filterOpener; onModalChange(false); setFilterOpener(undefined);}} />}
    {notice && <div className={s.notice}><p role="status">{notice}</p>
      <button type="button" className={s.chip} onClick={()=>setNotice(undefined)}>Закрыть</button>
    </div>}
  </section>;
}
