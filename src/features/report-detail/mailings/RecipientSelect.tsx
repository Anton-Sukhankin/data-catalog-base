import { useId, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { FilterValueList, type FilterValueOption } from '../../../components/FilterValueList/FilterValueList';
import { MultiSelectTrigger } from '../../../components/MultiSelectTrigger/MultiSelectTrigger';
import filter from '../../../components/ColumnFilterMenu/ColumnFilterMenu.module.css';
import select from '../../../components/SingleSelect/SingleSelect.module.css';
import { recipientFields, type RecipientField } from './deliveryModel';
import s from './ManualDelivery.module.css';

interface Props {
  field: RecipientField;
  options: readonly FilterValueOption[];
  selected: readonly string[];
  onChange: (values: readonly string[]) => void;
}

export function RecipientSelect({ field, options, selected, onChange }: Props) {
  const { label, placeholder } = recipientFields[field];
  const id = useId();
  const anchor = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<readonly string[]>([]);
  const [boundary, setBoundary] = useState<HTMLElement>();
  const displayedValues = open ? draft : selected;
  const items = options.filter(option => displayedValues.includes(option.value));
  const search = query.trim().toLocaleLowerCase('ru');
  const visible = options.filter(option => option.label.toLocaleLowerCase('ru').includes(search));

  function openOrClose(button: HTMLButtonElement) {
    trigger.current = button;
    setBoundary(button.closest<HTMLElement>('[data-detail-scroll]') ?? undefined);
    setDraft(selected);
    setQuery('');
    setOpen(!open);
  }

  function toggle(value: string) {
    setDraft(values => values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  }

  function remove(value: string) {
    const withoutValue = (values: readonly string[]) => values.filter(item => item !== value);
    if (open) setDraft(withoutValue);
    else onChange(withoutValue(selected));
  }

  function clear() {
    if (open) setDraft([]);
    else onChange([]);
  }

  function apply() {
    onChange(draft);
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }

  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Anchor asChild>
      <div ref={anchor} className={s.recipientField}>
        <span id={`${id}-label`} hidden>{label}</span>
        <MultiSelectTrigger fieldId={field} label={label} labelId={`${id}-label`} valueId={`${id}-value`}
          items={items} emptyLabel={placeholder} className={`${select.trigger} ${s.recipientTrigger}`} open={open}
          chevron="/images/metrics/catalog/chevron-down.svg" onOpen={openOrClose}
          onRemove={remove} onClear={clear} />
      </div>
    </Popover.Anchor>
    <Popover.Portal>
      <Popover.Content className={`${filter.menu} ${s.recipientPopup}`} align="start" sideOffset={8}
        collisionBoundary={boundary} collisionPadding={{ top: 88, right: 8, bottom: 64, left: 8 }} hideWhenDetached
        aria-label={label} data-dropdown-surface="true" data-recipient-popup
        onInteractOutside={event => {
          if (event.target instanceof Node && anchor.current?.contains(event.target)) event.preventDefault();
        }}
        onEscapeKeyDown={() => { requestAnimationFrame(() => trigger.current?.focus()); }}
        onCloseAutoFocus={event => event.preventDefault()}>
        <div className={s.recipientOptions}>
          <FilterValueList label={label} options={visible} totalOptionsCount={options.length} selectedValues={draft}
            searchValue={query} onSearchChange={setQuery} onToggleValue={toggle} alwaysShowSearch embedded />
          {visible.length === 0 && <p className={s.noRecipients}>Ничего не найдено</p>}
        </div>
        <div className={`${filter.actions} ${s.recipientActions}`} data-filter-actions>
          <button type="button" className={filter.reset} onClick={() => { setDraft([]); setQuery(''); }}>Сбросить</button>
          <button type="button" className={filter.apply} onClick={apply}>Применить</button>
        </div>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}
