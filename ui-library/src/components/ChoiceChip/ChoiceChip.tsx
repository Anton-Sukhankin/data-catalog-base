import type { ComponentPropsWithoutRef } from 'react';
import styles from './ChoiceChip.module.css';

export function ChoiceChip({ className, type = 'button', ...props }: ComponentPropsWithoutRef<'button'>) {
  return <button {...props} type={type} className={className ? `${styles.chip} ${className}` : styles.chip} />;
}
