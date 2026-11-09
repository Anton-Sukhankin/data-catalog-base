import { useRef } from 'react';
import motion from '../Accordion/Accordion.module.css';
import { FilterCountReset } from './FilterButton';
import styles from './SearchPanelToggle.module.css';

export function SearchPanelToggle({ panelId, visible, conditionCount, onToggle, onClear, labels = ['Скрыть поиск', 'Показать поиск'] }: {
  panelId: string;
  visible: boolean;
  conditionCount: number;
  onToggle: () => void;
  onClear: () => void;
  labels?: readonly [expanded: string, collapsed: string];
}) {
  const toggle = useRef<HTMLButtonElement>(null);
  return <div className={styles.control}>
    <button ref={toggle} type="button" className={`${styles.button} ${styles.toggle}`} aria-expanded={visible} aria-controls={panelId} onClick={onToggle}>
      <img className={motion.chevronIcon} data-open={visible} src="/images/metrics/catalog/chevron-down.svg" width="16" height="16" alt="" />
      {labels[visible ? 0 : 1]}
    </button>
    {!visible && <FilterCountReset count={conditionCount} onClear={() => {
      onClear();
      toggle.current?.focus();
    }} />}
  </div>;
}
