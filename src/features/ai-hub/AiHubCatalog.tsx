import { useId, useLayoutEffect, useRef, useState } from 'react';
import { DescriptionText } from '../../components/DescriptionText/DescriptionText';
import type { RefObject } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { ExternalLink, Heart } from 'lucide-react';
import motion from '../../components/Accordion/Accordion.module.css';
import { DetailSecondary } from '../../components/DetailHeader/DetailSecondary';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ListPagination } from '../../components/ListPagination/ListPagination';
import { paginate } from '../../data/pagination';
import { SearchPanelToggle } from '../../components/FilterButton/SearchPanelToggle';
import { SearchField } from '../../components/Search/SearchField';
import { SingleSelect } from '../../components/SingleSelect/SingleSelect';
import { RoundIconButton } from '../../components/RoundIconButton/RoundIconButton';
import { OverflowText } from '../../components/OverflowText/OverflowText';
import type { AiAction, AiFlag, AiSolution } from '../../data/aiHub';
import { AiSolutionDetail } from './AiSolutionDetail';
import s from './AiHubCatalog.module.css';

const selects = [
  { id:'type', label:'Тип', all:'Все типы' },
  { id:'domain', label:'Домен', all:'Все домены' },
  { id:'status', label:'Статус', all:'Все статусы' },
  { id:'platform', label:'Платформа', all:'Все платформы' },
] as const;
const flags: readonly {id:AiFlag; label:string}[] = [
  {id:'reuse',label:'Рекомендуются к переиспользованию'}, {id:'friday',label:'ИИ-пятница'},
  {id:'talent',label:'Клуб талантов'}, {id:'ui',label:'Есть UI'},
];
const actions: readonly {id:AiAction; label:string}[] = [
  {id:'recording',label:'Запись ИИ-пятницы'}, {id:'instructions',label:'Инструкции'}, {id:'tool',label:'Открыть инструмент'},
];
const plural = new Intl.PluralRules('ru');
const key = (id:string) => `ai.${id}`;

function SolutionCard({item, saved, onBookmark, onUnavailable, onOpen}:{
  item:AiSolution; saved:boolean; onBookmark:()=>void; onUnavailable:(label:string)=>void; onOpen:(item:AiSolution)=>void;
}) {
  const extra = item.flags.includes('reuse') ? 'Можно переиспользовать' : item.flags.includes('friday') ? 'ИИ-пятница' : undefined;
  return <article className={s.card} data-ai-solution={item.id} onClick={event => {
    if (event.target instanceof Element && !event.target.closest('button, a')) onOpen(item);
  }}>
    <div className={s.tags}>
      <span className={s.tag} data-tone={item.type === 'ИИ-помощник функций' ? 'purple' : 'blue'}>{item.type}</span>
      <span className={s.tag} data-tone={item.status === 'Демо' ? undefined : 'green'}>{item.status}</span>
      {extra && <span className={s.tag} data-tone={item.flags.includes('reuse') ? 'green' : undefined}>{extra}</span>}
    </div>
    <div className={s.cardBody}>
      <div className={s.cardHeading}>
        <h2><button type="button" className={s.titleButton} onClick={() => onOpen(item)}>{item.title}</button></h2>
        <div className={s.stats}>
          <span aria-label={`Просмотры: ${item.views}`}><img src="/images/source-catalog/eye.svg" width="16" height="16" alt=""/>{item.views}</span>
          <span aria-label={`Отметки «Нравится»: ${item.likes}`}><Heart size={14} aria-hidden="true"/>{item.likes}</span>
        </div>
      </div>
      <p className={s.domain}><DescriptionText text={`Домен · ${item.domain}`} /></p>
      <OverflowText as="p" className={s.description} fullText={item.description}>{item.description}</OverflowText>
    </div>
    <footer className={s.cardFooter}>
      <div className={s.actions}>{actions.map(({id,label}) => {
        const action = item.actions[id];
        if (!action) return null;
        const content = <>{label}<ExternalLink size={14} aria-hidden="true"/></>;
        return action.url
          ? <a className={s.action} key={id} href={action.url} aria-label={`${label} — ${item.title}`}>{content}</a>
          : <button className={s.action} key={id} type="button" aria-label={`${label} — ${item.title}`} onClick={()=>onUnavailable(label)}>{content}</button>;
      })}</div>
      <RoundIconButton icon="bookmark" aria-label={`Закладка — ${item.title}`} aria-pressed={saved} onClick={onBookmark}/>
    </footer>
  </article>;
}

export function AiHubCatalog({items, scrollPosition, bookmarks, onBookmark}:{
  items:readonly AiSolution[]; scrollPosition:RefObject<number>; bookmarks:ReadonlySet<string>;
  onBookmark:(id:string)=>void;
}) {
  const [params,setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice,setNotice] = useState<string>();
  const [compact,setCompact] = useState(false);
  const [filtersCollapsed,setFiltersCollapsed] = useState(false);
  const filterFieldsId = useId();
  const root = useRef<HTMLElement>(null);
  const lastOpened = useRef<string | undefined>(undefined);
  const selectedId = params.get(key('solution'));
  const selected = items.find(item=>item.id===selectedId);
  const isDetail = Boolean(selected);
  useLayoutEffect(()=>{
    const container = root.current?.closest('main');
    if (!container) return;
    if (isDetail) {
      root.current?.querySelector<HTMLElement>('[data-ai-detail-heading]')?.focus({preventScroll:true});
      return;
    }
    container.scrollTop = scrollPosition.current;
    if (lastOpened.current) {
      root.current?.querySelector<HTMLElement>(`[data-ai-solution="${CSS.escape(lastOpened.current)}"] h2 button`)?.focus({preventScroll:true});
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
  const fields = selects.map(field=>{
    const values = [...new Set(items.map(item=>item[field.id]))];
    const value = params.get(key(field.id)) ?? '';
    return {...field, values, selected:values.includes(value) ? value : ''};
  });
  const activeFlags = flags.filter(flag=>params.get(key(flag.id)) === '1');
  const shown = items.filter(item =>
    fields.every(field=>!field.selected || item[field.id] === field.selected) &&
    activeFlags.every(flag=>item.flags.includes(flag.id)) &&
    [item.title,item.description,item.owner,item.developer].some(value=>value?.toLocaleLowerCase('ru').includes(normalized))
  );
  const conditionCount = activeFlags.length + fields.filter(field=>field.selected).length;
  const hasFilters = Boolean(query || conditionCount);
  const noun = plural.select(shown.length);
  const page = paginate(shown, Number(params.get(key('page'))));
  const update = (id:string,value:string) => {
    if (id === 'page' || id !== 'solution' && page.pageIndex > 0) root.current?.closest('main')?.scrollTo(0, 0);
    setParams(previous=>{
      const next = new URLSearchParams(previous);
      if (id !== 'page' && id !== 'solution') next.delete(key('page'));
      if (value) next.set(key(id),value); else next.delete(key(id));
      return next;
    },{replace:true,state:location.state});
  };
  const reset = (includeQuery:boolean) => setParams(previous=>{
    const next = new URLSearchParams(previous);
    next.delete(key('page'));
    if (includeQuery) next.delete(key('query'));
    for (const id of [...selects.map(field=>field.id),...flags.map(flag=>flag.id)]) next.delete(key(id));
    return next;
  },{replace:true,state:location.state});

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

  return <section ref={root} className={s.catalog} aria-label="Каталог AI Hub"
    data-ai-view={isDetail ? 'detail' : 'catalog'} data-detail-compact={!isDetail && compact}
    data-paginated={!isDetail && page.pageCount > 1}>
    <div className={s.chrome}>
      <header className={s.heading}>
        <h1>AI Hub</h1>
        <DetailSecondary compact={!isDetail && compact}><p>Корпоративный каталог ИИ-решений</p></DetailSecondary>
      </header>
      {items.length > 0 && <div className={s.filters} aria-label="Фильтры AI Hub" role="group">
        <div className={s.searchRow}>
          <div className={s.search}>
            <SearchField aria-label="Поиск по решениям AI Hub" placeholder="Поиск по названию, описанию, владельцу или разработчику"
              value={query} onValueChange={value=>update('query',value)}/>
          </div>
          <SearchPanelToggle panelId={filterFieldsId} visible={!filtersCollapsed} labels={['Свернуть', 'Развернуть']}
            conditionCount={conditionCount} onToggle={()=>setFiltersCollapsed(previous=>!previous)} onClear={()=>reset(false)}/>
        </div>
        <div id={filterFieldsId} className={motion.reveal} data-open={!filtersCollapsed} inert={filtersCollapsed}>
          <div className={s.filterClip}>
            <div className={s.filterFields}>
              <div className={s.selects}>{fields.map(field=><SingleSelect key={field.id} label={field.label}
                value={field.selected} resetValue="" onValueChange={value=>update(field.id,value)}
                options={[{value:'',label:field.all},...field.values.map(value=>({value,label:value==='Все домены'?'Применимо ко всем доменам':value}))]} className={s.select}/>)}</div>
              <div className={s.filterFooter}>
                <div className={s.quick}>{flags.map(flag=><button type="button" className={s.chip} key={flag.id}
                  aria-pressed={activeFlags.includes(flag)} onClick={()=>update(flag.id,activeFlags.includes(flag)?'':'1')}>{flag.label}</button>)}</div>
                {hasFilters && <button type="button" className={s.reset} onClick={()=>reset(true)}>Сбросить фильтры</button>}
              </div>
            </div>
          </div>
        </div>
      </div>}
    </div>
    {selected ? <AiSolutionDetail item={selected} items={shown} saved={bookmarks.has(selected.id)}
      onBookmark={()=>onBookmark(selected.id)} onSelect={openSolution} onBack={backToCatalog} onNotice={setNotice}/>
    : <div data-ai-results data-detail-tab-content>
    {selectedId && <div className={s.empty} role="status"><p>Решение не найдено. Показан каталог.</p>
      <button type="button" className={s.reset} onClick={()=>update('solution','')}>К каталогу</button>
    </div>}
    {items.length > 0 && <p className={s.summary} role="status">Найдено {shown.length} {noun==='one'?'решение':noun==='few'?'решения':'решений'}</p>}
    {shown.length ? <div className={s.grid} data-ai-grid>
      {page.rows.map(item=><SolutionCard key={item.id} item={item} saved={bookmarks.has(item.id)} onBookmark={()=>onBookmark(item.id)}
        onUnavailable={label=>setNotice(`«${label}» недоступно в прототипе. Адрес для «${item.title}» не указан.`)} onOpen={openSolution}/>)}
    </div> : items.length
      ? <EmptyState title="Решения не найдены" description="Измените запрос или сбросьте фильтры." />
      : <EmptyState title="ИИ-решений пока нет" description="Здесь будут отображаться доступные решения каталога." />}
    <ListPagination {...page} sticky label="Страницы решений AI Hub" onPageChange={index => update('page', index ? String(index) : '')} />
    </div>}
    {notice && <div className={s.notice}><p role="status">{notice}</p>
      <button type="button" className={s.chip} onClick={()=>setNotice(undefined)}>Закрыть</button>
    </div>}
  </section>;
}
