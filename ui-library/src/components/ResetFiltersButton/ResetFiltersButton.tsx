import s from './ResetFiltersButton.module.css';

export function ResetFiltersButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return <button type="button" className={`${s.button} ${className}`} onClick={onClick}>Сбросить</button>;
}
