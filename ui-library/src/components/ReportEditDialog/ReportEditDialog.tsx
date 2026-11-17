import { useId, useLayoutEffect, useRef } from 'react';
import { RoundIconButton } from '../RoundIconButton/RoundIconButton';
import styles from './ReportEditDialog.module.css';

export function ReportEditDialog({ reportTitle, onClose }: { reportTitle: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dismiss = useRef<HTMLButtonElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
    dismiss.current?.focus();
  }, []);

  return <dialog ref={dialog} className={styles.dialog} onClose={onClose}
    aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
    <header className={styles.header}>
      <h2 id={`${id}-title`}>Раздел в разработке</h2>
      <RoundIconButton icon="close" aria-label="Закрыть окно" onClick={() => dialog.current?.close()} />
    </header>
    <p id={`${id}-description`}>Редактирование отчёта «{reportTitle}» станет доступно после завершения разработки.</p>
    <form method="dialog" className={styles.footer}>
      <button ref={dismiss} type="submit">Закрыть</button>
    </form>
  </dialog>;
}
