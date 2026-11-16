import { useRef, type MouseEventHandler } from 'react';
import { ResetBadge } from '../ResetBadge/ResetBadge';
import styles from './FilterButton.module.css';

export function FilterCountReset({ count, onClear }: { count: number; onClear?: () => void }) {
  if (count < 1) return null;
  return <button type="button" className={styles.count} aria-label={`Сбросить все фильтры: ${count} ${count === 1 ? 'атрибут' : count < 5 ? 'атрибута' : 'атрибутов'}`} onClick={onClear}>
    <span className={styles.value}>{count}</span><ResetBadge className={styles.reset} />
  </button>;
}

export function FilterButton({ count = 0, label = 'Открыть фильтры отчётов', onOpen, onClear }: {
  count?: number;
  label?: string;
  onOpen: MouseEventHandler<HTMLButtonElement>;
  onClear?: () => void;
}) {
  const openButton = useRef<HTMLButtonElement>(null);
  return <div className={styles.trigger}>
    <button ref={openButton} type="button" className={styles.open} aria-label={label} aria-haspopup="dialog" onClick={onOpen} data-control-action="filter">
      <img src={count > 0 ? new URL('../../assets/images/filter-trigger/applied.svg', import.meta.url).href : new URL('../../assets/images/filter-trigger/default.svg', import.meta.url).href} width="16" height="16" alt="" aria-hidden="true" />
    </button>
    <FilterCountReset count={count} onClear={() => {
      onClear?.();
      openButton.current?.focus();
    }} />
  </div>;
}
