import { Fragment } from 'react';
import s from './DescriptionText.module.css';

export function DescriptionSeparator() {
  return <span className={s.separator} data-description-separator>{' · '}</span>;
}

export function DescriptionText({ text }: { text: string }) {
  return text.split(' · ').map((part, index) => <Fragment key={index}>
    {index > 0 && <DescriptionSeparator />}{part}
  </Fragment>);
}
