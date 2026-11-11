import { useState } from 'react';
import { Popover } from 'radix-ui';
import { ColumnFilterMenu } from '../../components/ColumnFilterMenu/ColumnFilterMenu';
import { ColumnReset } from '../../components/ColumnReset/ColumnReset';
import { aiFilterFields, toggleAiValue, type AiColumn, type AiFilterOptions, type AiSort } from './aiFilters';
import s from './AiHubCatalog.module.css';

interface ColumnDraft { open: boolean; values: readonly string[]; search: string; sort?: AiSort }

export function AiColumnHeading({ column, options, values, sort, onApply, onClearFilter, onClearSort }: {
  column: AiColumn;
  options: AiFilterOptions[AiColumn];
  values: readonly string[];
  sort?: AiSort;
  onApply: (values: readonly string[], sort?: AiSort) => void;
  onClearFilter: () => void;
  onClearSort: () => void;
}) {
  const [draft, setDraft] = useState<ColumnDraft>();
  const { label } = aiFilterFields[column];
  const direction = sort?.column === column ? sort.direction : undefined;
  const open = draft?.open ?? false;
  function close() { setDraft(previous => previous?.open ? { ...previous, open: false } : previous); }
  return <th scope="col" aria-label={label} aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined}>
    <Popover.Root open={open} onOpenChange={next => { if (next) setDraft({ open: true, values, sort, search: '' }); else close(); }}>
      <div className={s.filterHeading} data-open={open} data-sort={direction}>
        <Popover.Trigger type="button" className={s.openHeading} aria-label={`Фильтр «${label}»`}><span>{label}</span></Popover.Trigger>
        {values.length && !open ? <ColumnReset label={`Сбросить фильтр «${label}»`} onReset={onClearFilter}>
          <img src="/images/report-table/filter-active.svg" width="16" height="16" alt="" />
        </ColumnReset> : <img src={`/images/report-table/${open ? 'filter-active' : 'filter'}.svg`} width="16" height="16" alt="" />}
        {direction && <ColumnReset label={`Сбросить сортировку «${label}»`} onReset={() => { close(); onClearSort(); }}>
          <img className={s.sortIndicator} data-sort-indicator={direction} src="/images/report-table/sort-applied.svg" width="16" height="16" alt="" />
        </ColumnReset>}
      </div>
      {draft && <Popover.Portal>
        <Popover.Content className={s.columnPopover} align="start" sideOffset={8} collisionPadding={8} role="presentation"
          data-column-dropdown-motion inert={!open}
          onOpenAutoFocus={event => {
            const control = event.currentTarget instanceof HTMLElement && event.currentTarget.querySelector<HTMLElement>('input[type="search"], button');
            if (control) { event.preventDefault(); control.focus(); }
          }}>
          <ColumnFilterMenu label={label} options={options.filter(option => option.label.toLocaleLowerCase('ru').includes(draft.search.trim().toLocaleLowerCase('ru')))}
            totalOptionsCount={options.length} selectedValues={draft.values} searchValue={draft.search}
            onSearchChange={search => setDraft(previous => previous && { ...previous, search })}
            onToggleValue={value => setDraft(previous => previous && { ...previous, values: toggleAiValue(previous.values, value) })}
            sortDirection={draft.sort?.column === column ? draft.sort.direction : undefined}
            onSortChange={next => setDraft(previous => previous && { ...previous, sort: previous.sort?.column === column && previous.sort.direction === next
              ? undefined : { column, direction: next } })}
            onReset={() => { onApply([], sort?.column === column ? undefined : sort); close(); }}
            onApply={() => { onApply(draft.values, draft.sort); close(); }} />
        </Popover.Content>
      </Popover.Portal>}
    </Popover.Root>
  </th>;
}
