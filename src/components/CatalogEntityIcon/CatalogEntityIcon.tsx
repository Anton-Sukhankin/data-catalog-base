import styles from './CatalogEntityIcon.module.css';

export function CatalogEntityIcon({ kind, className }: { kind: 'metric' | 'indicator' | 'reference' | 'source' | 'task'; className?: string }) {
  return <span className={`${styles.badge} ${styles.glyph} ${styles[kind]}${className ? ' ' + className : ''}`}
    aria-hidden="true" data-catalog-entity-icon={kind} />;
}
