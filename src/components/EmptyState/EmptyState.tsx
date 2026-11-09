import type { ComponentPropsWithoutRef } from 'react';
import s from './EmptyState.module.css';

type EmptyStateProps = Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'children'> & {
  title: string;
  description: string;
  compact?: boolean;
  action?: { label: string; onClick: () => void; variant?: 'filter-reset' };
};

export function EmptyState({ title, description, compact = false, action, className = '', ...props }: EmptyStateProps) {
  return <div {...props} className={`${s.root} ${className}`} data-compact={compact}>
    <img className={s.illustration} src="/images/report-detail/empty.png" alt="" width={144} height={96} />
    {compact ? <strong className={s.title}>{title}</strong> : <h2 className={s.title}>{title}</h2>}
    <p className={s.description}>{description}</p>
    {action && <button type="button" className={action.variant === 'filter-reset' ? `${s.action} ${s.reset}` : s.action}
      onClick={action.onClick}>{action.label}</button>}
  </div>;
}
