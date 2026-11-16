import type { ReactNode } from 'react';
import styles from './AttributeValue.module.css';

export function AttributeValue({ value, children }: {
  value: string | number | null | undefined;
  children?: ReactNode;
}) {
  if (value == null || typeof value === 'string' && /^(?:—)?$/.test(value.trim())) {
    return <span className={styles.missing} role="img" aria-label="Нет значения" data-missing-value>
      <span className={styles.measure} aria-hidden="true">—</span>
    </span>;
  }
  return children ?? value;
}
