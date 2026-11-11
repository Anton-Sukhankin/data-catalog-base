import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ListScrollIndicator } from '../../components/ListScrollIndicator/ListScrollIndicator';
import { ReportFilterPanel, type ReportFilterField, type ReportFilterFieldId } from '../../components/ReportFilterPanel';
import { FilterValueList } from '../../components/FilterValueList';
import '../../styles/base.css';
import styles from './FilterPanelPreview.module.css';
import { hasReportRange, reportFiltersValid, reportRangeScale, type ReportNumericAttribute, type ReportNumberRange } from '../../data/reportFilters';
import { shouldShowFilterSearch } from '../../components/FilterValueList/searchVisibility';

const params = new URLSearchParams(location.search);
const context = params.get('context') === 'favorites' ? 'favorites' : 'catalog';
const variant = params.get('case') ?? 'default';
const standalone = ['wide-list', 'compact-list', 'status-list', 'empty-list'].includes(variant);
const labels: Record<ReportFilterFieldId, string> = { domain:'Домен',title:'Отчёт',status:'Статус проверки',owner:'Владелец',masterSystem:'Мастер-система',platform:'Платформа',mau:'MAU',lastViewed:'Просмотр' };
const domains = ['Гостеприимство','Продажи и маркетинг','Клиентский сервис','Финансы','Управление персоналом','Строительство','Закупки','Информационные технологии'];
const compact = ['Все домены',...domains.slice(0,4)];
const status = ['Все','Проверено','Не проверено'];
const optionsFor = (id:ReportFilterFieldId) => (id === 'status' ? status : id === 'domain' ? context === 'favorites' ? compact : domains : ['Значение 1','Значение 2']).map(label=>({value:label,label}));
const initialFields:ReportFilterField[] = (Object.keys(labels) as ReportFilterFieldId[]).map(id=>{
  const selected = variant === 'selected' && id === (context === 'catalog' ? 'domain' : 'status');
  const value = selected ? context === 'catalog' ? domains[0] : 'Проверено' : 'Все';
  return {id,label:labels[id],value,selected,selectionMode:id === 'status' || id === 'mau' || id === 'lastViewed' ? 'single' : 'multiple',selectedOptions:selected ? [{value,label:value}] : []};
});

function Preview() {
  const [fields,setFields] = useState(initialFields);
  const [applied,setApplied] = useState(initialFields);
  const [ranges,setRanges] = useState<Partial<Record<ReportNumericAttribute,ReportNumberRange>>>({});
  const [appliedRanges,setAppliedRanges] = useState(ranges);
  const [open,setOpen] = useState(true);
  const [active,setActive] = useState<ReportFilterFieldId>();
  const [anchor,setAnchor] = useState<DOMRect>();
  const [query,setQuery] = useState('');
  const [values,setValues] = useState<string[]>([]);
  const [log,setLog] = useState<string[]>([]);
  const record = (text:string) => setLog(previous=>[...previous,text]);
  const close = () => {setOpen(false);setActive(undefined);setFields(applied);setRanges(appliedRanges);record('close: cancel draft');};
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='Escape' && open && !document.querySelector('[data-multi-selected-popup]'))close();};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);});
  const listWidth = variant === 'status-list' ? 212 : standalone ? 440 : active === 'owner' ? 292 : anchor?.width === 212 ? 212 : 440;
  const singleSelect = active === 'status' || variant === 'status-list';
  const rawOptions = variant === 'empty-list' ? [] : standalone ? (variant === 'status-list' ? status : variant === 'compact-list' ? compact : domains).map(label=>({value:label,label})) : optionsFor(active ?? 'domain');
  const showSearch = shouldShowFilterSearch(rawOptions.length, singleSelect ? 'single' : 'multiple', variant !== 'compact-list' && variant !== 'status-list' && !(active === 'domain' && context === 'favorites'));
  const filtered = rawOptions.filter(option=>option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const count = fields.filter(field=>field.selected).length + Number(hasReportRange(ranges.mau)) + Number(hasReportRange(ranges.lastViewed));
  const canApply = reportFiltersValid(ranges) && (JSON.stringify(fields)!==JSON.stringify(applied) || JSON.stringify(ranges)!==JSON.stringify(appliedRanges) || variant==='selected' && context==='catalog');
  const rangeField = (attribute:ReportNumericAttribute) => ({attribute,value:ranges[attribute],scaleMax:reportRangeScale([],attribute,ranges[attribute]),onChange:(value:ReportNumberRange)=>{setActive(undefined);setRanges(previous=>({...previous,[attribute]:value}));}});
  const listHeight = Math.min(276,Math.max(0,filtered.length*40-4))+12+(showSearch?56:0);
  const top = anchor ? anchor.bottom+8+listHeight>innerHeight ? Math.max(8,anchor.top-8-listHeight) : anchor.bottom+8 : 0;
  const left = anchor ? Math.max(8,Math.min(active === 'owner' ? anchor.right-listWidth : anchor.left,innerWidth-listWidth-8)) : 0;
  const list = <FilterValueList label={active ? labels[active] : 'Пример списка'} width={listWidth} showSearch={showSearch} selectionMode={singleSelect ? 'single' : 'multiple'} options={filtered} totalOptionsCount={rawOptions.length} selectedValues={singleSelect && values.length === 0 ? ['Все'] : values} searchValue={query}
    onSearchChange={value=>{setQuery(value);record(`search: ${value}`);}}
    onToggleValue={value=>{
      const next=active==='status'||variant==='status-list'?value==='Все'?[]:[value]:values.includes(value)?values.filter(item=>item!==value):[...values,value];
      setValues(next);record(`toggle: ${active ?? variant}: ${value}`);
      if(active)setFields(previous=>previous.map(field=>field.id===active?{...field,value:next.length?next.join(', '):'Все',selected:next.length>0,selectedOptions:next.map(value=>({value,label:value}))}:field));
    }} />;
  return <main className={styles.preview}>
    <aside className={styles.controller} aria-label="Технический контроллер">
      <h1>I08 · панель и список значений</h1>
      <p>Изолированная управляемая композиция. Примеры значений не являются справочником отчётов.</p>
      <nav>{['default','selected','wide-list','compact-list','status-list','empty-list'].map(key=><a key={key} href={`?context=${context}&case=${key}`}>{key}</a>)}<a href={`?context=${context==='catalog'?'favorites':'catalog'}`}>Сменить контекст</a></nav>
      <button type="button" onClick={()=>{setFields(applied);setRanges(appliedRanges);setOpen(true);}}>Открыть панель</button>
      <output data-panel-applied>{applied.filter(field=>field.selected).map(field=>`${field.id}: ${field.value}`).join('; ')||'нет'}</output>
      <ol data-panel-intents>{log.map((line,index)=><li key={index}>{line}</li>)}</ol>
    </aside>
    {standalone ? <div className={styles.listStage} data-list-stage>{list}</div> : open && <>
      <ReportFilterPanel context={context} fields={fields} rangeFields={{mau:rangeField('mau'),lastViewed:rangeField('lastViewed')}} activeFieldId={active} draftAttributeCount={count} canApply={canApply} showReset={count>0}
        onFieldClear={id=>{setFields(previous=>previous.map(field=>field.id===id?{...field,selectedOptions:[],value:'Все',selected:false}:field));if(active===id)setValues([]);}}
        onFieldValueRemove={(id,value)=>{setFields(previous=>previous.map(field=>{if(field.id!==id)return field;const next=(field.selectedOptions ?? []).filter(item=>item.value!==value);return {...field,selectedOptions:next,value:next.length?next.map(item=>item.label).join(', '):'Все',selected:next.length>0};}));if(active===id)setValues(previous=>previous.filter(item=>item!==value));}}
        onFieldOpen={(id,button)=>{if(active===id){setActive(undefined);return;}setActive(id);setAnchor(button.getBoundingClientRect());setQuery('');const field=fields.find(item=>item.id===id)!;setValues(field.selectedOptions?.map(item=>item.value) ?? (field.selected?[field.value]:[]));record(`open: ${id}`);}}
        onReset={()=>{setFields(initialFields.map(field=>({...field,value:'Все',selected:false})));setRanges({});setActive(undefined);record('reset: all draft; stays open');}}
        onApply={()=>{setApplied(fields);setAppliedRanges(ranges);setOpen(false);setActive(undefined);record('apply');}} onClose={close} />
      {active && <div className={styles.popup} style={{left,top}} data-panel-popup>{list}</div>}
    </>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /><ListScrollIndicator /></StrictMode>);
