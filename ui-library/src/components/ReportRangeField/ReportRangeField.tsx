import { useId, useLayoutEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { isReportRangeValid, mauThresholds, type ReportNumberRange, type ReportNumericAttribute } from '../../data/reportFilters';
import s from './ReportRangeField.module.css';

export interface ReportRangeFieldProps {
  attribute: ReportNumericAttribute;
  value?: ReportNumberRange;
  scaleMax: number;
  onChange: (value: ReportNumberRange) => void;
}

/** Shared range surface for the general panel and column menu. Scale is not a filter limit. */
export function ReportRangeField({ attribute, value = {}, scaleMax, onChange }: ReportRangeFieldProps) {
  const id = useId();
  const minField = useRef<HTMLInputElement>(null);
  const maxField = useRef<HTMLInputElement>(null);
  const label = attribute === 'mau' ? 'MAU' : 'Последний просмотр';
  const valid = isReportRangeValid(value);
  const descriptionId = !valid ? `${id}-error` : attribute === 'mau' ? `${id}-description` : undefined;
  const minInput = Number.isNaN(value.min) ? undefined : value.min;
  const maxInput = Number.isNaN(value.max) ? undefined : value.max;
  const maximum = Math.max(1, scaleMax, minInput ?? 0, maxInput ?? 0);
  const lower = Math.min(maximum, Math.max(0, minInput ?? 0));
  const upper = Math.min(maximum, Math.max(lower, maxInput ?? maximum));
  const left = lower / maximum * 100;
  const right = upper / maximum * 100;
  useLayoutEffect(() => {
    // Presets and panel reset must also clear a partial number that the
    // browser displays even though its DOM value is already an empty string.
    if (value.min === undefined && minField.current?.validity.badInput) minField.current.value = '';
    if (value.max === undefined && maxField.current?.validity.badInput) maxField.current.value = '';
  }, [value.min, value.max]);
  function input(bound: 'min' | 'max', field: HTMLInputElement) {
    onChange({ ...value, [bound]: field.validity.badInput || field.value !== '' ? field.valueAsNumber : undefined });
  }
  function numberInputEvents(bound: 'min' | 'max') {
    return {
      onInput(event: FormEvent<HTMLInputElement>) {
        const field = event.currentTarget;
        // The browser exposes incomplete numbers as empty strings, so React's
        // change event may not fire when validity changes on its own.
        if (field.value === '' && (field.validity.badInput || Number.isNaN(value[bound]))) input(bound, field);
      },
      onChange(event: ChangeEvent<HTMLInputElement>) {
        const field = event.currentTarget;
        if (field.value !== '' || (!field.validity.badInput && !Number.isNaN(value[bound]))) input(bound, field);
      },
    };
  }
  return <div className={s.field} data-report-range={attribute} data-invalid={!valid}>
    <div className={s.label} id={`${id}-label`}>
      <span>{label}</span>
      {attribute === 'mau' && <span className={s.description} id={`${id}-description`}>Количество активных пользователей за месяц</span>}
    </div>
    <div className={s.input}>
      <label className={s.value}><span>От</span><input ref={minField} type="number" inputMode="numeric" min="0" step="1" aria-label={`${label}: от`} aria-invalid={!valid} aria-describedby={descriptionId}
        value={minInput ?? ''} placeholder="0" {...numberInputEvents('min')} /></label>
      <label className={`${s.value} ${s.upper}`}><span>До</span><input ref={maxField} type="number" inputMode="numeric" min="0" step="1" aria-label={`${label}: до`} aria-invalid={!valid} aria-describedby={descriptionId}
        value={maxInput ?? ''} placeholder="Любое" {...numberInputEvents('max')} /></label>
      <div className={s.slider}>
        <div className={s.track} /><div className={s.progress} style={{ left:`calc(${left}% + ${10 - left / 5}px)`, right:`calc(${100 - right}% + ${10 - (100 - right) / 5}px)` }} />
        {[left, right].map((position, index) => <span key={index} className={s.knob} style={{ left:`calc(${position}% - ${position / 5}px)` }} aria-hidden="true"><img src={new URL('../../assets/images/report-range/thumb.svg', import.meta.url).href} width="68" height="68" alt="" /></span>)}
        <input className={s.range} type="range" min="0" max={maximum} step="1" value={lower} aria-label={`${label}: нижняя граница`} style={{ zIndex:lower === maximum ? 4 : 2 }}
          onChange={event => onChange({ ...value, min:Math.min(event.currentTarget.valueAsNumber, upper) })} />
        <input className={s.range} type="range" min="0" max={maximum} step="1" value={upper} aria-label={`${label}: верхняя граница`}
          onChange={event => onChange({ ...value, max:Math.max(event.currentTarget.valueAsNumber, lower) })} />
      </div>
    </div>
    {!valid && <p id={`${id}-error`} className={s.error} role="alert">Введите целые числа от 0; «От» не должно превышать «До».</p>}
    {attribute === 'mau' && <div className={s.chips} role="group" aria-label="Пороги MAU">
      {mauThresholds.map(threshold => <button type="button" key={threshold} aria-pressed={value.min === threshold && value.max === undefined}
        onClick={() => onChange({ min:threshold })}>От {threshold}</button>)}
    </div>}
  </div>;
}
