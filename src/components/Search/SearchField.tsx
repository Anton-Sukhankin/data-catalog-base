import styles from './SearchField.module.css';
import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string;
  onValueChange: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  trailing?: ReactNode;
  appearance?: 'header' | 'local';
}

/** The caller supplies the query, actions and results. */
export function SearchField({ value, onValueChange, inputRef, trailing, appearance, placeholder = 'Поиск по каталогу', 'aria-label': label = 'Поиск по каталогу', ...inputProps }: SearchFieldProps) {
  return (
    <div className={styles.field} data-appearance={appearance}>
      <img src="/icons/search/search.svg" width="16" height="16" alt="" aria-hidden="true" />
      <input {...inputProps} ref={inputRef} type="search" aria-label={label} placeholder={placeholder}
        autoComplete="off" value={value} onChange={(event) => onValueChange(event.target.value)} />
      {trailing}
    </div>
  );
}
