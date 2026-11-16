import type { RefObject } from 'react';
import { ResetBadge } from '../ResetBadge/ResetBadge';
import styles from './SelectClearButton.module.css';

export function SelectClearButton({ label, trigger, onClear, multiple = false }: {
  label: string;
  trigger: RefObject<HTMLButtonElement | null>;
  onClear: () => void;
  multiple?: boolean;
}) {
  return <button type="button" className={styles.clear} aria-label={`Очистить выбор: ${label}`} data-select-clear
    data-multi-select-clear={multiple || undefined} onClick={() => {
      onClear();
      trigger.current?.focus();
    }}><ResetBadge className={styles.badge} /></button>;
}
