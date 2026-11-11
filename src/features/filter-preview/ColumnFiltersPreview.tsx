import { StrictMode, useState } from 'react';
import { SingleSelect } from '../../components/SingleSelect/SingleSelect';
import { createRoot } from 'react-dom/client';
import { ListScrollIndicator } from '../../components/ListScrollIndicator/ListScrollIndicator';
import { ColumnFilterMenu } from '../../components/ColumnFilterMenu/ColumnFilterMenu';
import '../../styles/base.css';
import { filterExamples, type FilterPreviewExample } from './fixtures';
import styles from './ColumnFiltersPreview.module.css';
import { isReportRangeValid, reportRangeScale, type ReportNumberRange } from '../../data/reportFilters';

const params = new URLSearchParams(window.location.search);
const initialExample = filterExamples.find(example => example.key === params.get('case')) ?? filterExamples[0];

function ExampleController({ example }: { example: FilterPreviewExample }) {
  const initialDirection = params.get('sort') === 'asc' ? 'asc' : params.get('sort') === 'desc' ? 'desc' : undefined;
  const initialValues = initialDirection ? [] : [...example.selected];
  const [applied, setApplied] = useState(initialValues);
  const [draft, setDraft] = useState(initialValues);
  const numeric = example.label === 'MAU' ? 'mau' : /просмотр/i.test(example.label) ? 'lastViewed' : undefined;
  const [range,setRange] = useState<ReportNumberRange>({});
  const [appliedRange,setAppliedRange] = useState(range);
  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | undefined>(initialDirection);
  const [open, setOpen] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const visibleOptions = example.options.filter(option => option.label.toLowerCase().includes(search.toLowerCase()));
  function record(message: string) { setLog(previous => [...previous, message]); }
  function closeWithoutApplying() { setOpen(false); setDraft([...applied]); setRange(appliedRange); setSearch(''); record('close: cancel draft'); }
  return (
    <div onKeyDown={event => { if (event.key === 'Escape' && open) { event.stopPropagation(); closeWithoutApplying(); } }}>
      <aside className={styles.controller} aria-label="Технический контроллер">
        <button type="button" onClick={() => { setDraft([...applied]); setRange(appliedRange); setSearch(''); setOpen(true); record('open: applied values'); }}>Открыть меню</button>
        <button type="button" onClick={closeWithoutApplying}>Закрыть без применения</button>
        <p>Это изолированный пример. Поиск фильтрует только переданные демонстрационные подписи. Сортировка записывает намерение; порядок данных не вычисляется. Выбранное направление отмечено одной галочкой.</p>
        <output data-applied-values>Применённые значения: {numeric ? JSON.stringify(appliedRange) : applied.length ? applied.join(', ') : 'нет'}</output>
        <output data-draft-values>Черновик: {numeric ? JSON.stringify(range) : draft.length ? draft.join(', ') : 'нет'}</output>
      </aside>
      <div className={styles.stage} data-menu-stage>
        {open && <ColumnFilterMenu label={example.label} options={visibleOptions} totalOptionsCount={example.options.length} selectedValues={draft} searchValue={search}
          range={numeric ? {attribute:numeric,value:range,scaleMax:reportRangeScale([],numeric,range),onChange:setRange} : undefined}
          onSearchChange={value => { setSearch(value); record(`search: ${value}`); }}
          onToggleValue={value => { setDraft(previous => previous.includes(value) ? previous.filter(item => item !== value) : [...previous, value]); record(`toggle: ${value}`); }}
          sortDirection={sortDirection}
          onSortChange={direction => { record(`sort: ${direction}`); setSortDirection(previous => previous === direction ? undefined : direction); }}
          onReset={() => { setDraft([]); setRange({}); setApplied([]); setAppliedRange({}); setOpen(false); record('reset: clear applied column; close'); }}
          onApply={() => { if(!isReportRangeValid(range))return;setApplied([...draft]);setAppliedRange(range);setOpen(false);record(`apply: ${numeric ? JSON.stringify(range) : draft.join(',')}`); }} />}
      </div>
      <aside className={styles.log} aria-label="Журнал намерений">
        <h2>Технический журнал</h2>
        <ol data-filter-intents aria-live="polite">{log.map((message, index) => <li key={index}>{message}</li>)}</ol>
      </aside>
    </div>
  );
}

function ColumnFiltersPreview() {
  const [example, setExample] = useState(initialExample);
  return (
    <main className={styles.preview}>
      <h1>I07 · локальное меню фильтра</h1>
      <label className={styles.examplePicker}>Пример <SingleSelect label="Пример фильтра" value={example.key} onValueChange={value=>setExample(filterExamples.find(item=>item.key===value)!)} options={filterExamples.map(item=>({value:item.key,label:`${item.label} · ${item.options.length} значений`}))}/></label>
      <ExampleController key={example.key} example={example} />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><ColumnFiltersPreview /><ListScrollIndicator /></StrictMode>);
