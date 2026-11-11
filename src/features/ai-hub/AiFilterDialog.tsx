import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { filterValueListHeight, placePanelValueList } from '../../app/filterPanelPosition';
import { FilterValueList } from '../../components/FilterValueList/FilterValueList';
import { shouldShowFilterSearch } from '../../components/FilterValueList/searchVisibility';
import { ReportFilterPanel } from '../../components/ReportFilterPanel';
import type { AiFlag } from '../../data/aiHub';
import { aiFilterCount, aiFilterFields, aiFilterIds, aiFlags, emptyAiFilters, sameAiFilters, toggleAiValue, type AiFilterField, type AiFilterOptions, type AiFilters } from './aiFilters';
import s from './AiHubCatalog.module.css';

export function AiQuickFilters({ active, onToggle }: { active: readonly AiFlag[]; onToggle: (id: AiFlag) => void }) {
  return <div className={s.quick}>{aiFlags.map(({ id, label }) => (
    <button type="button" className={s.chip} key={id} aria-pressed={active.includes(id)} onClick={() => onToggle(id)}>{label}</button>
  ))}</div>;
}

const fieldRows = [['type', 'domain'], ['status', 'platform']] as const;

export function AiFilterDialog({ opener, applied, options, onApply, onClose, onModalChange }: {
  opener: HTMLElement; applied: AiFilters; options: AiFilterOptions;
  onApply: (filters: AiFilters) => void; onClose: () => void; onModalChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState(applied);
  const [exit, setExit] = useState<'cancel' | 'apply'>();
  const [field, setField] = useState<{ id: AiFilterField; anchor: HTMLButtonElement }>();
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ left: 0, top: 0, width: 212 });
  const root = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const fieldOptions = field ? options[field.id] : [];
  const visibleOptions = fieldOptions.filter(option => option.label.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
  const showSearch = shouldShowFilterSearch(fieldOptions.length, 'multiple', true);
  const popupHeight = filterValueListHeight(visibleOptions.length, showSearch);

  useLayoutEffect(() => {
    onModalChange(true);
    root.current?.querySelector('button')?.focus();
    return () => onModalChange(false);
  }, [onModalChange]);

  useLayoutEffect(() => {
    if (!field) return;
    const anchor = field.anchor;
    function align() {
      const bounds = anchor.getBoundingClientRect();
      const width = Math.min(212, innerWidth - 16);
      const next = { ...placePanelValueList(bounds, width, popupHeight, { width: innerWidth, height: innerHeight }), width };
      setPosition(previous => previous.left === next.left && previous.top === next.top && previous.width === next.width ? previous : next);
    }
    align();
    window.addEventListener('resize', align);
    document.addEventListener('scroll', align, true);
    return () => { window.removeEventListener('resize', align); document.removeEventListener('scroll', align, true); };
  }, [field, popupHeight]);

  useLayoutEffect(() => {
    if (!field) return;
    (popup.current?.querySelector<HTMLInputElement>('input[type="search"]') ?? popup.current?.querySelector('input'))?.focus();
  }, [field]);

  useEffect(() => {
    function keyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (document.querySelector('[data-multi-selected-popup]')) return;
        if (field) { setField(undefined); field.anchor.focus(); }
        else setExit(previous => previous ?? 'cancel');
      }
      if (event.key !== 'Tab') return;
      if (exit) { event.preventDefault(); return; }
      const controls = [...root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? []]
        .filter(control => control.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    function outside(event: PointerEvent) {
      if (field && event.target instanceof Node && !popup.current?.contains(event.target) &&
        !(field.anchor.closest('[data-multi-select]') ?? field.anchor).contains(event.target)) setField(undefined);
    }
    document.addEventListener('keydown', keyDown, true);
    document.addEventListener('pointerdown', outside, true);
    return () => { document.removeEventListener('keydown', keyDown, true); document.removeEventListener('pointerdown', outside, true); };
  }, [field, exit]);

  function updateField(id: AiFilterField, update: (values: readonly string[]) => readonly string[]) {
    setDraft(previous => ({ ...previous, fields: { ...previous.fields, [id]: update(previous.fields[id] ?? []) } }));
  }
  function startExit(action: 'cancel' | 'apply') {
    setField(undefined);
    setExit(previous => previous ?? action);
  }

  const container = field && root.current?.querySelector('[data-report-filter-panel]');
  const count = aiFilterCount(draft);
  return createPortal(<div ref={root} className={s.filterDialog}>
    <ReportFilterPanel<AiFilterField> context="catalog" opener={opener} fieldRows={fieldRows}
      fields={aiFilterIds.map(id => {
        const selectedOptions = options[id].filter(option => draft.fields[id]?.includes(option.value));
        return { id, label: aiFilterFields[id].label, value: aiFilterFields[id].all, selected: selectedOptions.length > 0,
          selectionMode: 'multiple', selectedOptions };
      })}
      activeFieldId={field?.id} draftAttributeCount={count} canApply={!sameAiFilters(applied, draft)} showReset={count > 0}
      closing={Boolean(exit)} onExitComplete={() => { if (exit === 'apply') onApply(draft); onClose(); }}
      onFieldOpen={(id, anchor) => { setField(field?.id === id ? undefined : { id, anchor }); setQuery(''); }}
      onFieldValueRemove={(id, value) => updateField(id, values => values.filter(item => item !== value))}
      onFieldClear={id => updateField(id, () => [])}
      onReset={() => { setField(undefined); setDraft(emptyAiFilters); }} onApply={() => startExit('apply')} onClose={() => startExit('cancel')}>
      <section className={s.modalQuick} aria-label="Быстрые фильтры">
        <AiQuickFilters active={draft.flags} onToggle={id => setDraft(previous => ({ ...previous, flags: toggleAiValue(previous.flags, id) }))} />
      </section>
    </ReportFilterPanel>
    {field && container && createPortal(<div ref={popup} className={s.filterValuePopup} style={position}
      role="dialog" aria-label={`Значения: ${aiFilterFields[field.id].label}`}>
      <FilterValueList label={aiFilterFields[field.id].label} width="100%" options={visibleOptions} totalOptionsCount={fieldOptions.length}
        selectedValues={draft.fields[field.id] ?? []} showSearch={showSearch} searchValue={query} onSearchChange={setQuery}
        onToggleValue={value => updateField(field.id, values => toggleAiValue(values, value))} />
    </div>, container)}
  </div>, document.body);
}
