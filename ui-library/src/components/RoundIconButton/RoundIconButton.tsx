import type { ComponentPropsWithoutRef } from 'react';
import s from './RoundIconButton.module.css';

const icons = {
  edit: new URL('../../assets/images/report-detail/chrome/edit.svg', import.meta.url).href,
  bookmark: new URL('../../assets/images/report-detail/chrome/bookmark.svg', import.meta.url).href,
  back: new URL('../../assets/images/news/reading-back.svg', import.meta.url).href,
  open: new URL('../../assets/images/report-table/chevron-right.svg', import.meta.url).href,
  chevron: new URL('../../assets/images/metrics/catalog/chevron-down.svg', import.meta.url).href,
  close: new URL('../../assets/images/filter-panel/close-catalog.svg', import.meta.url).href,
} as const;

type Props = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & { icon: keyof typeof icons };

/** Shared outlined action, with a compact size for back; the caller owns behavior and accessible name. */
export function RoundIconButton({ icon, className = '', type = 'button', ...props }: Props) {
  return <button {...props} type={type} className={`${s.button} ${className}`} data-round-action={icon}>
    <span className={s.glyph} aria-hidden="true" style={{ maskImage: `url("${icons[icon]}")` }} />
  </button>;
}
