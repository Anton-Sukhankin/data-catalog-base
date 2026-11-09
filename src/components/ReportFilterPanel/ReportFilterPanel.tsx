import { OverflowText } from '../OverflowText/OverflowText';
import { Fragment, useEffectEvent, useId, useLayoutEffect, useRef } from 'react';
import styles from './ReportFilterPanel.module.css';
import { ReportRangeField, type ReportRangeFieldProps } from '../ReportRangeField/ReportRangeField';
import type { ReportNumericAttribute } from '../../data/reportFilters';
import { MultiSelectTrigger } from '../MultiSelectTrigger/MultiSelectTrigger';
import { SelectClearButton } from '../SelectClearButton/SelectClearButton';
import clearStyles from '../SelectClearButton/SelectClearButton.module.css';
import type { FilterValueOption } from '../FilterValueList/FilterValueList';

export type ReportFilterFieldId = 'domain' | 'title' | 'status' | 'owner' | 'masterSystem' | 'platform' | 'mau' | 'lastViewed';
export interface ReportFilterField<Id extends string = ReportFilterFieldId> {
  id: Id;
  label: string;
  /** The caller supplies the complete summary, including the unrestricted state. */
  value: string;
  selected: boolean;
  selectionMode?: 'single' | 'multiple';
  selectedOptions?: readonly FilterValueOption[];
}
export interface ReportFilterPanelProps<Id extends string = ReportFilterFieldId> {
  context: 'catalog' | 'favorites';
  opener?: HTMLElement;
  fields: readonly ReportFilterField<Id>[];
  rangeFields?: Record<ReportNumericAttribute, ReportRangeFieldProps>;
  activeFieldId?: Id;
  title?: string;
  fieldRows?: readonly (readonly Id[])[];
  groupLabels?: Readonly<Record<number, string>>;
  draftAttributeCount: number;
  canApply: boolean;
  showReset: boolean;
  closing?: boolean;
  onExitComplete?: () => void;
  onFieldOpen: (id: Id, anchor: HTMLButtonElement) => void;
  onFieldValueRemove: (id: Id, value: string) => void;
  onFieldClear: (id: Id) => void;
  onReset: () => void;
  onApply: () => void;
  onClose: () => void;
}
const rows: readonly (readonly ReportFilterFieldId[])[] = [
  ['domain'], ['title'], ['status', 'owner'], ['masterSystem'], ['platform'], ['mau'], ['lastViewed'],
];

function PanelSingleFilter({ field, labelId, valueId, open, onOpen, onClear }: {
  field: ReportFilterField<string>;
  labelId: string;
  valueId: string;
  open: boolean;
  onOpen: (anchor: HTMLButtonElement) => void;
  onClear: () => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const chevron = open ? 'chevron-open' : field.id === 'domain' || field.id === 'status' ? 'chevron-domain-status' : 'chevron';
  return <div className={clearStyles.control} data-can-clear={field.selected}>
    <button ref={trigger} type="button" className={styles.select} aria-labelledby={`${labelId} ${valueId}`} aria-haspopup="dialog" aria-expanded={open}
      onClick={event => onOpen(event.currentTarget)} data-panel-field={field.id}>
      <OverflowText id={valueId} className={styles.value} fullText={field.value}>{field.value}</OverflowText>
      <img className={open ? styles.openChevron : undefined} src={`/images/filter-panel/${chevron}.svg`} alt="" aria-hidden="true" />
    </button>
    {field.selected && !open && <SelectClearButton label={field.label} trigger={trigger} onClear={onClear} />}
  </div>;
}

/** Controlled surface. The caller owns draft/apply, focus, Escape and the external popup portal. */
export function ReportFilterPanel<Id extends string = ReportFilterFieldId>({ context, opener, fields, rangeFields, activeFieldId, title: customTitle, fieldRows, groupLabels, draftAttributeCount, canApply, showReset, closing = false, onExitComplete, onFieldOpen, onFieldValueRemove, onFieldClear, onReset, onApply, onClose }: ReportFilterPanelProps<Id>) {
  const id = useId();
  const backdrop = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const motion = useRef<Animation[]>([]);
  const finishExit = useEffectEvent(() => onExitComplete?.());
  useLayoutEffect(() => {
    const dimmer = backdrop.current;
    const surface = reveal.current;
    const content = panel.current;
    if (!opener?.isConnected || !dimmer || !surface || !content || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const from = opener.getBoundingClientRect();
    const to = content.getBoundingClientRect();
    const bounds = surface.getBoundingClientRect();
    if (!from.width || !from.height || !to.width || !to.height) return;

    // Animate the viewport-sized mask so the real panel and its controls keep their final geometry.
    const clip = (box: DOMRect, radius: string) => `inset(${box.top - bounds.top}px ${bounds.right - box.right}px ${bounds.bottom - box.bottom}px ${box.left - bounds.left}px round ${radius})`;
    const { backgroundColor, borderTopLeftRadius } = getComputedStyle(content);
    const timing = { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' } satisfies KeyframeAnimationOptions;
    const animations = [
      dimmer.animate([{ opacity: 0 }, { opacity: 1 }], timing),
      surface.animate([
        { clipPath: clip(from, `${Math.min(from.width, from.height) / 2}px`), backgroundColor },
        { clipPath: clip(to, borderTopLeftRadius), backgroundColor },
      ], timing),
      content.animate([{ opacity: 0 }, { opacity: 0, offset: 0.57 }, { opacity: 1 }], { ...timing, easing: 'linear' }),
    ];
    motion.current = animations;
    return () => {
      animations.forEach(animation => animation.cancel());
      motion.current = [];
    };
  }, [opener]);
  useLayoutEffect(() => {
    if (!closing) return;
    const animations = motion.current.filter(animation => Number(animation.currentTime) > 0);
    if (!animations.length || !opener?.isConnected || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishExit();
      return;
    }
    // Reverse from the current frame, including when dismissal interrupts the opening.
    for (const animation of animations) {
      animation.effect?.updateTiming({ fill: 'both' });
      animation.reverse();
      animation.updatePlaybackRate(-1.4);
    }
    let active = true;
    void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (active) finishExit();
    });
    return () => { active = false; };
  }, [closing, opener]);
  const title = customTitle ?? (context === 'catalog' ? 'Фильтры отчётов' : 'Фильтры избранных отчётов');
  const visibleRows = fieldRows ?? rows as readonly (readonly Id[])[];
  return <div className={styles.layer}>
    <div ref={backdrop} className={styles.backdrop} data-panel-backdrop onClick={onClose} />
    <div ref={reveal} className={styles.reveal} data-filter-panel-morph data-closing={closing || undefined}>
    <section ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className={styles.panel} data-report-filter-panel data-context={context} inert={closing}>
      <header className={styles.header}>
        <div className={styles.headline}>
          <h2 id={`${id}-title`}>{title}</h2>
          {draftAttributeCount > 0 && <span className={styles.count} aria-label={`Настроено атрибутов: ${draftAttributeCount}`} data-panel-count>{draftAttributeCount}</span>}
        </div>
        <button type="button" className={styles.iconClose} aria-label="Закрыть панель фильтров" onClick={onClose}>
          <img src={`/images/filter-panel/close-${context}.svg`} alt="" aria-hidden="true" />
        </button>
      </header>
      <div className={styles.content} data-panel-content>
        <div className={styles.fields}>
          {visibleRows.map((row, index) => <Fragment key={index}>
            {groupLabels?.[index] && <h3 className={styles.groupTitle}>{groupLabels[index]}</h3>}
            <div className={styles.row}>
            {row.map(fieldId => {
              const field = fields.find(item => item.id === fieldId);
              if (!field) return null;
              if (rangeFields && (field.id === 'mau' || field.id === 'lastViewed')) return <div key={field.id} className={`${styles.field} ${styles.rangeField}`} data-field={field.id} data-panel-field={field.id} data-selected={field.selected}><ReportRangeField {...rangeFields[field.id as ReportNumericAttribute]} /></div>;
              const isOpen = activeFieldId === field.id;
              const labelId = `${id}-${field.id}-label`;
              const valueId = `${id}-${field.id}-value`;
              return <div key={field.id} className={styles.field} data-field={field.id} data-selected={field.selected}>
                <span id={labelId} className={styles.label}>{field.label}</span>
                {field.selectionMode === 'multiple' ? <MultiSelectTrigger label={field.label} labelId={labelId} valueId={valueId} fieldId={field.id}
                  items={field.selectedOptions ?? []} emptyLabel={field.selected ? 'Все' : field.value} open={isOpen} className={styles.select}
                  chevron={`/images/filter-panel/${isOpen ? 'chevron-open' : field.id === 'domain' ? 'chevron-domain-status' : 'chevron'}.svg`}
                  onOpen={anchor => onFieldOpen(field.id, anchor)} onRemove={value => onFieldValueRemove(field.id, value)} onClear={() => onFieldClear(field.id)} />
                : <PanelSingleFilter field={field} labelId={labelId} valueId={valueId} open={isOpen}
                  onOpen={anchor => onFieldOpen(field.id, anchor)} onClear={() => onFieldClear(field.id)} />}
              </div>;
            })}
          </div></Fragment>)}
        </div>
      </div>
      <footer className={styles.footer} data-panel-actions>
        {showReset && <button type="button" className={styles.reset} onClick={onReset}>Сбросить</button>}
        <span className={styles.spacer} />
        <button type="button" className={styles.close} onClick={onClose}>Закрыть</button>
        <button type="button" className={styles.apply} disabled={!canApply} onClick={onApply}>Применить</button>
      </footer>
    </section>
    </div>
  </div>;
}
