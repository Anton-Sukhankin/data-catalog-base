import type { ReactNode } from 'react';
import motion from '../Accordion/Accordion.module.css';

export function DetailSecondary({ compact, children }: { compact: boolean; children: ReactNode }) {
  return <div className={motion.reveal} data-open={!compact} data-detail-secondary inert={compact}>
    <div className={motion.clip}>{children}</div>
  </div>;
}
