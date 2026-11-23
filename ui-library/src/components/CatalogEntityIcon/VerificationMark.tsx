import styles from './VerificationMark.module.css';

export function VerificationMark({ overlay = false, size = overlay ? 18 : 16, label, className }: {
  overlay?: boolean;
  size?: number;
  label?: string;
  className?: string;
}) {
  return <svg width={size} height={size} viewBox={overlay ? '0 0 18 18' : '0 0 16 16'}
    className={`${styles.mark}${className ? ' ' + className : ''}`} data-verification-mark={overlay ? 'overlay' : 'inline'}
    role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    {overlay ? <>
      <circle className={styles.overlay} cx="9" cy="9" r="8" strokeWidth="2" />
      <circle className={styles.ring} cx="9" cy="9" r="7" strokeWidth="1" />
      <path className={styles.overlayCheck} d="M6.6 9l1.6 1.6 3.2-3.2" strokeWidth="1.5" />
    </> : <>
      <circle className={styles.inline} cx="8" cy="8" r="5.8667" strokeWidth="1.0667" />
      <path className={styles.inlineCheck} d="M5.4222 8l1.6889 1.6889 3.3778-3.5556" strokeWidth="1.1111" />
    </>}
  </svg>;
}
