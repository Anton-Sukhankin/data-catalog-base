import type { ComponentProps } from 'react';
import { EmptyState } from '../../components/EmptyState/EmptyState';

export function EmptyDetail({ title, description, viewport = false, announce = false, action }: {
  title: string;
  description: string;
  viewport?: boolean;
  announce?: boolean;
  action?: ComponentProps<typeof EmptyState>['action'];
}) {
  return <EmptyState title={title} description={description} compact={!viewport} action={action}
    data-report-empty={viewport ? 'viewport' : 'section'} role={announce ? 'status' : undefined} />;
}
