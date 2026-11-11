import { useId, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { OverflowText } from '../../components/OverflowText/OverflowText';
import { FilterValueList, type FilterValueOption } from '../../components/FilterValueList/FilterValueList';
import { MultiSelectTrigger } from '../../components/MultiSelectTrigger/MultiSelectTrigger';
import { SelectClearButton } from '../../components/SelectClearButton/SelectClearButton';
import clearStyles from '../../components/SelectClearButton/SelectClearButton.module.css';
import type { DictionaryFilterField } from '../../data/dictionary';
import selectStyles from '../../components/SingleSelect/SingleSelect.module.css';
import s from './Dictionary.module.css';

interface Props {
  field: DictionaryFilterField;
  label: string;
  options: readonly FilterValueOption[];
  selected: readonly string[];
  single: boolean;
  unavailable?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (values: readonly string[]) => void;
}

const chevron = '/images/metrics/catalog/chevron-down.svg';
const allOption = { value: '', label: 'Все' };
const emptyLabels: Record<DictionaryFilterField, string> = {
  type: 'Все типы',
  domain: 'Все домены',
  status: 'Все статусы',
  owner: 'Все владельцы',
};

export function DictionaryFilter({ field, label, options, selected, single, unavailable, open, onOpenChange, onChange }: Props) {
  const id = useId();
  const anchor = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  const byValue = new Map(options.map(option => [option.value, option]));
  const items = selected.flatMap(value => byValue.get(value) ?? []);
  const choices = single ? [allOption, ...options] : options;
  const search = query.trim().toLocaleLowerCase('ru');
  const visible = search ? choices.filter(item => item.label.toLocaleLowerCase('ru').includes(search)) : choices;
  const emptyLabel = emptyLabels[field];
  const current = items[0]?.label ?? emptyLabel;
  const triggerClass = `${selectStyles.trigger} ${s.select}`;

  function openOrClose(button: HTMLButtonElement) {
    trigger.current = button;
    setQuery('');
    onOpenChange(!open);
  }

  function remove(value: string) {
    onChange(selected.filter(item => item !== value));
  }

  function choose(value: string) {
    if (single) {
      onChange(value ? [value] : []);
      onOpenChange(false);
      trigger.current?.focus();
    } else if (selected.includes(value)) {
      remove(value);
    } else {
      onChange([...selected, value]);
    }
  }

  return <Popover.Root open={open} onOpenChange={onOpenChange}>
    <div className={s.filter}>
      <span id={id + '-label'} hidden>{label}</span>
      <Popover.Anchor asChild>
        <div ref={anchor} className={single ? clearStyles.control : s.multiFilter} data-can-clear={single && items.length > 0}>
          {single ? <>
            <button ref={trigger} type="button" className={triggerClass} aria-haspopup="dialog" aria-expanded={open}
              aria-labelledby={id + '-label ' + id + '-value'} onClick={event => openOrClose(event.currentTarget)}>
              <OverflowText id={id + '-value'} fullText={current}>{current}</OverflowText>
              <img src={chevron} width="16" height="16" alt="" aria-hidden="true" />
            </button>
            {items.length > 0 && !open && <SelectClearButton label={label} trigger={trigger} onClear={() => onChange([])} />}
          </> : <MultiSelectTrigger fieldId={field} label={label} labelId={id + '-label'} valueId={id + '-value'}
            items={items} emptyLabel={emptyLabel} className={triggerClass} open={open} chevron={chevron}
            onOpen={openOrClose} onRemove={remove} onClear={() => onChange([])} />}
        </div>
      </Popover.Anchor>
    </div>
    <Popover.Portal>
      <Popover.Content className={s.filterPopup} align={field === 'owner' ? 'end' : 'start'} sideOffset={8} collisionPadding={8}
        aria-label={`Значения фильтра: ${label}`}
        onInteractOutside={event => {
          if (event.target instanceof Node && anchor.current?.contains(event.target)) event.preventDefault();
        }}
        onEscapeKeyDown={() => { requestAnimationFrame(() => trigger.current?.focus()); }}>
        {unavailable ? <p className={s.unavailableFilter}>Значения фильтра не предоставлены.</p> : <FilterValueList label={label} options={visible} totalOptionsCount={choices.length} width="100%"
          selectedValues={single ? [selected[0] ?? ''] : selected} searchValue={query} onSearchChange={setQuery}
          onToggleValue={choose} selectionMode={single ? 'single' : 'multiple'} showSearch={choices.length > 7} />}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}
