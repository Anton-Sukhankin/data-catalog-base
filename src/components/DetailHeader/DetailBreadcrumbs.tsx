import { Fragment } from 'react';
import s from './DetailHeader.module.css';

export interface DetailCrumb {
  label: string;
  onSelect: () => void;
}

type BreadcrumbProps = {
  current: string;
} & (
  { ancestors: readonly DetailCrumb[]; pathLabel?: undefined }
  | { ancestors: readonly Pick<DetailCrumb, 'label'>[]; pathLabel: string }
);

export function DetailBreadcrumbs({ ancestors, current, pathLabel }: BreadcrumbProps) {
  const Container = pathLabel ? 'div' : 'nav';
  return <Container className={s.breadcrumbs} role={pathLabel ? 'group' : undefined} aria-label={pathLabel ?? 'Хлебные крошки'}>
    {ancestors.map((crumb, index) => <Fragment key={index}>
      {'onSelect' in crumb
        ? <button type="button" onClick={crumb.onSelect}>{crumb.label}</button>
        : <span className={s.crumbAncestor}>{crumb.label}</span>}
      <img src="/images/report-detail/chrome/breadcrumb-chevron.svg" width="16" height="16" alt="" />
    </Fragment>)}
    <span aria-current={pathLabel ? 'location' : 'page'}>{current}</span>
  </Container>;
}
