import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReportFilterPanel } from '../../components/ReportFilterPanel/ReportFilterPanel';
import { FilterValueList } from '../../components/FilterValueList/FilterValueList';
import { shouldShowFilterSearch } from '../../components/FilterValueList/searchVisibility';
import { filterValueListHeight, placePanelValueList } from '../../app/filterPanelPosition';
import { isSingleSourceAttribute, sourceAttributes, sourceFilterCount, sourceFiltersEqual, sourceLabels, sourceOptions, toggleSourceFilter, type SourceAttribute, type SourceFilters, type SourceSummary } from '../../data/sources';
import s from './Sources.module.css';

interface Field { id: SourceAttribute; anchor: HTMLButtonElement; query: string; width: 212 | 440; left: number; top: number }
interface Overlay { kind: 'panel' | 'column'; opener: HTMLElement; draft: SourceFilters; attributes: readonly SourceAttribute[]; label: string; field?: Field; queries: Partial<Record<SourceAttribute,string>>; exit?: 'cancel' | 'apply' }
const rows: readonly (readonly SourceAttribute[])[] = [['domain'], ['platform', 'layer'], ['masterSystem'], ['personalData', 'description'], ['analytics', 'similar']];
const groups = { 0:'Расположение источника', 3:'Свойства данных', 4:'Использование и связи' };

export function useSourceFilterOverlay({ records, applied, onApply, onModalChange }: {
  records: readonly SourceSummary[]; applied: SourceFilters; onApply: (filters: SourceFilters) => void; onModalChange: (open: boolean) => void;
}) {
  const [state, setState] = useState<Overlay>();
  const root = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const focusAfterClose = useRef<HTMLElement>(null);
  function close() {
    if (state) focusAfterClose.current = state.opener;
    setState(undefined);
    onModalChange(false);
  }
  function dismiss() {
    if (state?.kind !== 'panel') { close(); return; }
    setState(previous => previous && !previous.exit ? { ...previous, exit: 'cancel', field: undefined } : previous);
  }
  function openPanel(opener: HTMLElement) { setState({kind:'panel',opener,draft:{...applied},attributes:sourceAttributes,label:'Фильтры источников',queries:{}}); onModalChange(true); }
  function openColumn(label: string, attributes: readonly SourceAttribute[], opener: HTMLElement) { setState({kind:'column',label,attributes,opener,draft:{...applied},queries:{}}); onModalChange(false); }
  function toggle(id: SourceAttribute, value: string) { setState(previous => previous && { ...previous, draft:value === 'all' ? {...previous.draft,[id]:undefined} : toggleSourceFilter(previous.draft,id,value) }); }
  function removeValue(id: SourceAttribute, value: string) {
    setState(previous => {
      if (!previous) return previous;
      const next = (previous.draft[id] ?? []).filter(item => item !== value);
      return { ...previous, draft: { ...previous.draft, [id]: next.length ? next : undefined } };
    });
  }
  function clearValues(id: SourceAttribute) { setState(previous => previous && { ...previous, draft: { ...previous.draft, [id]: undefined } }); }
  function options(id: SourceAttribute, query = '') {
    const values = sourceOptions(records,id);
    const all = isSingleSourceAttribute(id) ? [{value:'all',label: id === 'analytics' || id === 'similar' ? 'Не важно' : 'Все'}, ...values] : values;
    return all.filter(option => option.label.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')));
  }
  const hasSearch = (id: SourceAttribute) => shouldShowFilterSearch(options(id).length, isSingleSourceAttribute(id) ? 'single' : 'multiple', !isSingleSourceAttribute(id));
  function openField(id: SourceAttribute, anchor: HTMLButtonElement) {
    if (state?.field?.id === id) { setState(previous => previous && {...previous,field:undefined}); return; }
    const width = anchor.getBoundingClientRect().width > 320 ? 440 : 212;
    const position = placePanelValueList(anchor.getBoundingClientRect(),width,filterValueListHeight(options(id).length,hasSearch(id)),{width:innerWidth,height:innerHeight});
    setState(previous => previous && {...previous,field:{id,anchor,width,query:'',...position}});
  }
  function apply() {
    if (!state || state.exit) return;
    if (state.kind === 'panel') {
      setState({ ...state, exit: 'apply', field: undefined });
      return;
    }
    onApply(state.draft);
    close();
  }
  function finishExit() {
    if (state?.exit === 'apply') onApply(state.draft);
    close();
  }
  function reset() {
    if (state?.kind === 'column') {
      const next = { ...applied };
      for (const id of state.attributes) delete next[id];
      onApply(next);
      close();
      return;
    }
    setState(previous => previous && { ...previous, draft: {}, field: undefined });
  }
  useEffect(() => () => onModalChange(false), [onModalChange]);
  useEffect(() => {
    if (!state) return;
    const modal = state.kind === 'panel';
    function key(event: KeyboardEvent) {
      if (state?.exit && (event.key === 'Escape' || event.key === 'Tab')) {
        event.preventDefault(); event.stopPropagation(); return;
      }
      if (event.key === 'Escape') { if (document.querySelector('[data-multi-selected-popup]')) return; event.preventDefault(); event.stopPropagation(); if (state?.field) { const anchor = state.field.anchor; setState(previous => previous && {...previous,field:undefined}); anchor.focus(); } else dismiss(); }
      if (event.key === 'Tab' && modal) {
        const buttons = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)') ?? []).filter(node => node.getClientRects().length);
        const first = buttons[0], last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    function outside(event: PointerEvent) {
      const target = event.target as Node;
      if (state?.field && !popup.current?.contains(target) && !(state.field.anchor.closest('[data-multi-select]') ?? state.field.anchor).contains(target)) setState(previous => previous && {...previous,field:undefined});
      if (!modal && !root.current?.contains(target) && !state?.opener.contains(target)) close();
    }
    function geometry() {
      if (!modal) { setState(previous => previous && {...previous}); return; }
      if (state?.field) {
        const field = state.field;
        const position = placePanelValueList(field.anchor.getBoundingClientRect(),field.width,filterValueListHeight(options(field.id,field.query).length,hasSearch(field.id)),{width:innerWidth,height:innerHeight});
        setState(previous => previous?.field ? {...previous,field:{...previous.field,...position}} : previous);
      }
    }
    document.addEventListener('keydown',key,true); document.addEventListener('pointerdown',outside,true);
    window.addEventListener('resize',geometry); document.addEventListener('scroll',geometry,true);
    return () => { document.removeEventListener('keydown',key,true); document.removeEventListener('pointerdown',outside,true); window.removeEventListener('resize',geometry); document.removeEventListener('scroll',geometry,true); };
  }, [state?.kind,state?.opener,state?.field?.id,state?.field?.query,state?.exit]);
  useLayoutEffect(() => { if (state) root.current?.querySelector<HTMLElement>('button,input')?.focus(); },[state?.kind,state?.opener]);
  useLayoutEffect(() => {
    if (state?.opener) return;
    focusAfterClose.current?.focus();
    focusAfterClose.current = null;
  }, [state?.opener]);
  const values = (id: SourceAttribute) => state?.draft[id]?.length ? state.draft[id]! : isSingleSourceAttribute(id) ? ['all'] : [];
  function list(id: SourceAttribute, query: string, width?: 212 | 440) {
    return <FilterValueList label={sourceLabels[id]} width={width} options={options(id,query)} totalOptionsCount={options(id).length} selectedValues={values(id)} showSearch={hasSearch(id)} selectionMode={isSingleSourceAttribute(id) ? 'single' : 'multiple'} embedded={width === undefined}
      searchValue={query} onSearchChange={value => setState(previous => previous && {...previous,queries:{...previous.queries,[id]:value},field:previous.field?.id === id ? {...previous.field,query:value} : previous.field})} onToggleValue={value => toggle(id,value)} />;
  }
  let overlay;
  if (state?.kind === 'panel') overlay = createPortal(<div ref={root} data-source-filter-panel>
    <ReportFilterPanel<SourceAttribute> context="catalog" opener={state.opener} title="Фильтры источников" fieldRows={rows} groupLabels={groups}
      fields={sourceAttributes.map(id => ({ id,label:sourceLabels[id],selected:Boolean(state.draft[id]?.length),selectionMode:isSingleSourceAttribute(id) ? 'single' : 'multiple',selectedOptions:(state.draft[id] ?? []).map(value => sourceOptions(records,id).find(option => option.value === value) ?? {value,label:value}),value:state.draft[id]?.length ? state.draft[id]!.map(value => sourceOptions(records,id).find(option => option.value === value)?.label ?? value).join(', ') : id === 'analytics' || id === 'similar' ? 'Не важно' : 'Все' }))}
      activeFieldId={state.field?.id} draftAttributeCount={sourceFilterCount(state.draft)} canApply={!sourceFiltersEqual(applied,state.draft)} showReset={sourceFilterCount(state.draft)>0}
      closing={Boolean(state.exit)} onExitComplete={finishExit} onFieldOpen={openField} onFieldValueRemove={removeValue} onFieldClear={clearValues} onReset={reset} onApply={apply} onClose={dismiss} />
    {state.field && root.current?.querySelector('[data-report-filter-panel]') && createPortal(<div ref={popup} className={s.fieldPopup} style={{left:state.field.left,top:state.field.top}} role="dialog" aria-label={`Значения: ${sourceLabels[state.field.id]}`} data-source-values={state.field.id}>
      {list(state.field.id,state.field.query,state.field.width)}
    </div>,root.current.querySelector('[data-report-filter-panel]')!)}
  </div>,document.body);
  if (state?.kind === 'column') {
    const bounds = (state.opener.parentElement ?? state.opener).getBoundingClientRect();
    const grouped = state.attributes.length > 1;
    const preferredWidth = grouped ? 320 : state.attributes[0] === 'analytics' ? 264 : 240;
    const width = Math.min(preferredWidth, innerWidth - 16);
    const left = Math.max(8, Math.min(bounds.left, innerWidth - width - 8));
    const top = Math.max(8,Math.min(bounds.bottom+8,innerHeight-260));
    overlay = createPortal(<div ref={root} role="dialog" aria-label={`Фильтр: ${state.label}`} className={s.columnMenu} style={{left,top,width,maxHeight:`calc(100vh - ${top+12}px)`}} data-source-column-menu>
      <div className={s.columnContent}>{state.attributes.map(id => <section key={id}>
        {grouped && <h3>{sourceLabels[id]}</h3>}
        {list(id,state.queries[id] ?? '')}
      </section>)}</div>
      <div className={s.columnActions}><button type="button" className={s.columnReset} onClick={reset}>Сбросить</button><button type="button" disabled={sourceFiltersEqual(applied,state.draft)} onClick={apply}>Применить</button></div>
    </div>,document.body);
  }
  return { overlay,openPanel,openColumn,close,isOpen:Boolean(state),activeColumn:state?.kind === 'column' ? state.label : undefined };
}
