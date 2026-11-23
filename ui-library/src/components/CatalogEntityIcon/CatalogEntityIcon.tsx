import type { ReactNode } from 'react';
import styles from './CatalogEntityIcon.module.css';

export function CatalogEntityIcon({ kind, className, children }: { kind: 'report' | 'domain' | 'metric' | 'indicator' | 'reference' | 'source' | 'task' | 'ai'; className?: string; children?: ReactNode }) {
  return <span className={`${styles.badge} ${styles.glyph} ${styles[kind]}${className ? ' ' + className : ''}`}
    aria-hidden={children == null ? true : undefined} data-catalog-entity-icon={kind}>{children}</span>;
}
