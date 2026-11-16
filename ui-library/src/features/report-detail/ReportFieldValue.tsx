import type { ReactNode } from 'react';
import s from './ReportFieldValue.module.css';

export function ReportFieldValue({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return <div className={className ? `${s.field} ${className}` : s.field}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>;
}
