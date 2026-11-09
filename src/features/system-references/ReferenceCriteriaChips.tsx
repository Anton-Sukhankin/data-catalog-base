import { Fragment, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { X } from 'lucide-react';
import { Popover } from 'radix-ui';
import { packTags } from '../../components/MultiSelectTrigger/packTags';
import { OverflowText } from '../../components/OverflowText/OverflowText';
import type { ReferenceFilters } from '../../data/systemReferences';
import { referenceChevron, referenceCriteria, type ReferenceCriterion, type ReferenceCriterionKey } from './referenceCriteria';
import s from './ReferenceCriteriaChips.module.css';
import panel from './ReferenceSearchPanel.module.css';

type Edit = { criterion: ReferenceCriterion; original: string };
type Session = { kind: 'direct'; edit: Edit; width: number } | { kind: 'overflow'; edit?: Edit };
type Layout = { keys: ReferenceCriterionKey[]; lastWidth: number };

const [entityName, attributeName, entityLogicalName, attributeLogicalName, relationship, option] = referenceCriteria;
const chipCriteria = [entityName, entityLogicalName, attributeName, attributeLogicalName, relationship, option];

function Chevron() {
  return <img src={referenceChevron} width="12" height="12" alt="" />;
}

function CriterionEditor({ edit, value, onChange, onCancel }: {
  edit: Edit;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  useLayoutEffect(() => { input.current?.focus({ preventScroll: true }); }, [edit.criterion.key]);
  return <>
    <label className={s.editorLabel} htmlFor={id}>{edit.criterion.label}</label>
    <div className={s.editorActions}>
      <input id={id} ref={input} className={s.input} value={value} placeholder={edit.criterion.placeholder}
        onChange={event => onChange(event.target.value)} />
      <button type="button" className={panel.action} onClick={onCancel}>Отмена</button>
    </div>
  </>;
}

export function ReferenceCriteriaChips({ enabled, draft, onChange, onEmptyFocus }: {
  enabled: boolean;
  draft: ReferenceFilters;
  onChange: (patch: Partial<ReferenceFilters>) => void;
  onEmptyFocus: () => void;
}) {
  const [session, setSession] = useState<Session>();
  const [layout, setLayout] = useState<Layout>({ keys: [], lastWidth: 0 });
  const rail = useRef<HTMLUListElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const id = useId();
  const edit = session?.edit;
  const direct = session?.kind === 'direct' ? session : undefined;
  const pinnedHidden = session?.kind === 'overflow' ? edit?.criterion.key : undefined;
  const items = chipCriteria.filter(({ key }) => draft[key].trim() || edit?.criterion.key === key);
  const visible = items.filter(({ key }) => key !== pinnedHidden && (layout.keys.includes(key) || direct?.edit.criterion.key === key));
  const hidden = items.filter(item => !visible.includes(item));
  const open = enabled && Boolean(session && (direct || hidden.length));

  useLayoutEffect(() => {
    const row = rail.current;
    const sizing = measure.current;
    if (!row || !sizing) return;
    let active = true;
    function update() {
      if (!active || !row || !sizing) return;
      const boxes = [...sizing.querySelectorAll<HTMLElement>('[data-measure-chip]')];
      const sizes = new Map(boxes.map(node => [node.dataset.measureChip, node.getBoundingClientRect().width]));
      const counters = [0, ...[...sizing.querySelectorAll('[data-measure-counter]')].map(node => node.getBoundingClientRect().width)];
      const keys = boxes.map(node => node.dataset.measureChip as ReferenceCriterionKey);
      const candidates = pinnedHidden ? keys.slice(0, keys.indexOf(pinnedHidden)) : keys;
      const pinnedCount = keys.length - candidates.length;
      const available = row.clientWidth;
      const gap = Number.parseFloat(getComputedStyle(row).columnGap);
      function fit(order: ReferenceCriterionKey[]) {
        const widths = order.map(key => sizes.get(key) ?? 0);
        // Keep the edited item and the remainder of its list in the overflow surface.
        widths.push(...Array<number>(pinnedCount).fill(Infinity));
        let packed = packTags(available, widths, counters, 72, gap);
        // Move a partial trailing chip into the list. A long first chip can still shrink.
        while (packed.visibleCount > 1 && packed.lastWidth < widths[packed.visibleCount - 1]) {
          widths[packed.visibleCount - 1] = Infinity;
          packed = packTags(available, widths, counters, 72, gap);
        }
        return packed;
      }
      let packed = fit(candidates);
      const current = direct?.edit.criterion.key;
      if (current && !candidates.slice(0, packed.visibleCount).includes(current)) {
        candidates.splice(candidates.indexOf(current), 1);
        candidates.unshift(current);
        packed = fit(candidates);
      }
      const next = { keys: candidates.slice(0, packed.visibleCount), lastWidth: packed.lastWidth };
      setLayout(previous => previous.lastWidth === next.lastWidth && previous.keys.join() === next.keys.join() ? previous : next);
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    observer.observe(sizing);
    void document.fonts.ready.then(update);
    return () => { active = false; observer.disconnect(); };
  }, [draft, direct, pinnedHidden]);

  useLayoutEffect(() => {
    if (!enabled || (session?.kind === 'overflow' && !hidden.length)) setSession(undefined);
  }, [enabled, session, hidden.length]);

  function focusTrigger(key?: ReferenceCriterionKey, preferOverflow = false) {
    requestAnimationFrame(() => {
      const target = key && rail.current?.querySelector<HTMLButtonElement>(`[data-crm-chip-action="${key}"]`);
      const counter = rail.current?.querySelector<HTMLButtonElement>('[data-crm-overflow]');
      const first = rail.current?.querySelector<HTMLButtonElement>('button');
      const button = preferOverflow ? counter || target || first : target || counter || first;
      if (button) button.focus();
      else onEmptyFocus();
    });
  }

  function begin(criterion: ReferenceCriterion, width?: number) {
    const next = { criterion, original: draft[criterion.key] };
    setSession(width === undefined ? { kind: 'overflow', edit: next } : { kind: 'direct', edit: next, width });
  }

  function cancel() {
    if (!edit) return;
    const key = edit.criterion.key;
    onChange({ [key]: edit.original });
    if (session?.kind === 'overflow') {
      setSession({ kind: 'overflow' });
      requestAnimationFrame(() => {
        const row = popup.current?.querySelector<HTMLButtonElement>(`[data-crm-hidden-edit="${key}"]`);
        if (row) row.focus();
        else focusTrigger(key, true);
      });
    } else {
      setSession(undefined);
      focusTrigger(key);
    }
  }

  function remove(key: ReferenceCriterionKey, fromOverflow = false) {
    onChange({ [key]: '' });
    if (!fromOverflow) {
      setSession(undefined);
      focusTrigger();
    } else if (!edit) {
      requestAnimationFrame(() => {
        const first = popup.current?.querySelector<HTMLButtonElement>('[data-crm-hidden-edit]');
        if (first) first.focus();
        else focusTrigger(undefined, true);
      });
    }
  }

  function renderEditor() {
    if (!edit) return null;
    const key = edit.criterion.key;
    return <CriterionEditor key={key} edit={edit} value={draft[key]}
      onChange={value => onChange({ [key]: value })} onCancel={cancel} />;
  }

  function chipText({ key, shortLabel }: ReferenceCriterion) {
    return draft[key].trim() ? `${shortLabel}: ${draft[key]}` : shortLabel;
  }

  const overflowOpen = session?.kind === 'overflow';
  const counter = <button type="button" className={s.counter} data-crm-overflow data-crm-chip-action="overflow"
      aria-haspopup="dialog" aria-expanded={overflowOpen} aria-controls={overflowOpen ? id : undefined}
      onClick={() => {
        if (overflowOpen) { setSession(undefined); focusTrigger(undefined, true); }
        else {
          setSession({ kind: 'overflow' });
          requestAnimationFrame(() => popup.current?.querySelector<HTMLButtonElement>('[data-crm-hidden-edit]')?.focus());
        }
      }}>
      Ещё {hidden.length}<Chevron />
  </button>;

  return <Popover.Root modal={false} open={open} onOpenChange={next => { if (!next) setSession(undefined); }}>
    <ul ref={rail} className={s.rail} role="list" aria-label="Текстовые условия поиска" data-crm-criteria-empty={items.length === 0}>
      {visible.map(item => {
        const { key, label } = item;
        const selected = direct?.edit.criterion.key === key;
        const text = chipText(item);
        const last = layout.keys.at(-1) === key;
        const chip = <li className={s.chip} data-crm-chip={key} data-active={selected}
          style={{
            width: selected ? direct?.width : undefined,
            '--reference-chip-fit-width': last ? `${layout.lastWidth}px` : undefined,
          } as CSSProperties}>
          <button type="button" className={s.editChip} data-crm-chip-action={key} aria-haspopup="dialog"
            aria-expanded={selected} aria-controls={selected ? id : undefined}
            onClick={event => {
              if (selected) { setSession(undefined); focusTrigger(key); }
              else begin(item, Math.ceil(event.currentTarget.parentElement!.getBoundingClientRect().width));
            }}>
            <Chevron /><OverflowText fullText={draft[key]}>{text}</OverflowText>
          </button>
          <button type="button" className={s.remove} aria-label={`Удалить условие «${label}»`} onClick={() => remove(key)}><X size={12} aria-hidden="true" /></button>
        </li>;
        return selected ? <Popover.Anchor key={key} asChild>{chip}</Popover.Anchor> : <Fragment key={key}>{chip}</Fragment>;
      })}
      {hidden.length > 0 && <li className={s.counterItem}>
        {overflowOpen ? <Popover.Anchor asChild>{counter}</Popover.Anchor> : counter}
      </li>}
    </ul>
    <div ref={measure} className={s.measure} aria-hidden="true">
      {items.map(item => <span key={item.key} className={s.chip} data-measure-chip={item.key}
        style={{ width: direct?.edit.criterion.key === item.key ? direct.width : undefined }}>
        <span className={s.editChip}><Chevron /><span>{chipText(item)}</span></span>
        <span className={s.remove}><X size={12} /></span>
      </span>)}
      {items.map((item, index) => <span key={item.key} className={s.counter} data-measure-counter>Ещё {index + 1}<Chevron /></span>)}
    </div>
    {open && <Popover.Portal>
      <Popover.Content ref={popup} id={id} className={s.popup} data-mode={session?.kind}
        aria-label={direct ? `Редактор условия «${direct.edit.criterion.label}»` : 'Скрытые условия поиска'}
        data-dropdown-surface="true" align={direct ? 'start' : 'end'} sideOffset={8} collisionPadding={8}
        onOpenAutoFocus={event => {
          event.preventDefault();
          if (!edit) popup.current?.querySelector<HTMLButtonElement>('[data-crm-hidden-edit]')?.focus();
        }}
        onCloseAutoFocus={event => event.preventDefault()}
        onInteractOutside={event => {
          if (event.target instanceof Element && event.target.closest('[data-crm-chip-action]')) event.preventDefault();
        }}
        onKeyDown={event => {
          if (event.key !== 'Tab') return;
          const controls = [...event.currentTarget.querySelectorAll('button,input')];
          const boundary = event.shiftKey ? controls[0] : controls.at(-1);
          if (boundary !== event.target) return;
          event.preventDefault();
          setSession(undefined);
          focusTrigger(edit?.criterion.key, overflowOpen);
        }}
        onEscapeKeyDown={event => {
          event.preventDefault();
          if (edit) cancel();
          else { setSession(undefined); focusTrigger(undefined, true); }
        }}>
        {direct ? renderEditor() : <ul className={s.hiddenList} aria-label="Скрытые текстовые условия" role="list">
          {hidden.map(item => {
            const editing = edit?.criterion.key === item.key;
            return <li key={item.key} className={editing ? s.hiddenItem : `${s.hiddenItem} ${s.hiddenChoice}`} data-editing={editing}>
              {editing ? renderEditor() : <>
                <button type="button" className={s.hiddenEdit} data-crm-hidden-edit={item.key} onClick={() => begin(item)}>
                  <span>{item.label}</span><OverflowText fullText={draft[item.key]}>{draft[item.key]}</OverflowText>
                </button>
                <button type="button" className={s.remove} aria-label={`Удалить условие «${item.label}»`} onClick={() => remove(item.key, true)}><X size={12} aria-hidden="true" /></button>
              </>}
            </li>;
          })}
        </ul>}
      </Popover.Content>
    </Popover.Portal>}
  </Popover.Root>;
}
