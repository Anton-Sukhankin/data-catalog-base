import type { Ref } from 'react';
import styles from './AskQuestionDialog.module.css';

export function AskQuestionButton({ ref, onClick, className }: {
  ref?: Ref<HTMLButtonElement>;
  onClick: () => void;
  className?: string;
}) {
  return <button type="button" ref={ref} className={className ? `${styles.trigger} ${className}` : styles.trigger}
    aria-haspopup="dialog" onClick={onClick}>
    <img src="/icons/sidebar/questions.svg" width="16" height="16" alt="" />
    Задать вопрос
  </button>;
}
