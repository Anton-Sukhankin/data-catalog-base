import styles from './SelectionCheck.module.css';

/** Original DS-03 Check; the reserved slot keeps selected and unselected labels aligned. */
export function SelectionCheck({selected}:{selected:boolean}) {
  return <span className={styles.slot} aria-hidden="true">{selected && <img src={new URL('../../assets/images/dropdown/check.svg', import.meta.url).href} width="24" height="24" alt="" data-selection-check />}</span>;
}
