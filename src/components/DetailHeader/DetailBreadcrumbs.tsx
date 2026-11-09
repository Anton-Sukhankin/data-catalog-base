import { Fragment } from 'react';
import s from './DetailHeader.module.css';

export interface DetailCrumb {
  label: string;
  onSelect: () => void;
}

export function DetailBreadcrumbs({ ancestors, current }: {
  ancestors: readonly DetailCrumb[];
  current: string;
}) {
  return <nav className={s.breadcrumbs} aria-label="Хлебные крошки">
    {ancestors.map(({ label, onSelect }, index) => <Fragment key={index}>
      <button type="button" onClick={onSelect}>{label}</button>
      <img src="/images/report-detail/chrome/breadcrumb-chevron.svg" width="16" height="16" alt="" />
    </Fragment>)}
    <span aria-current="page">{current}</span>
  </nav>;
}
