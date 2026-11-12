import { useId, useState } from 'react';
import type { ReportSummary } from '../../data/reports';
import motion from '../Accordion/Accordion.module.css';
import { ReportCard, type ReportCardData } from './ReportCard';
import styles from './ReportCardGroups.module.css';

export function ReportCardGroups({ reports, onOpen, onEdit, viewportOffset = 108, bottomReserve = 32, layout = 'home', groupByDomain = true }: {
  reports: readonly ReportCardData[];
  onOpen: (report: ReportSummary) => void;
  onEdit: (report: ReportSummary) => void;
  viewportOffset?: number;
  bottomReserve?: number;
  layout?: 'home' | 'catalog';
  groupByDomain?: boolean;
}) {
  const groupId = useId();
  const [collapsedDomains, setCollapsedDomains] = useState<ReadonlySet<string>>(() => new Set());
  const groups = new Map<string, ReportCardData[]>();
  for (const report of groupByDomain ? reports : []) {
    const domain = report.domainGroup ?? report.domain;
    const group = groups.get(domain);
    if (group) group.push(report);
    else groups.set(domain, [report]);
  }

  function toggleDomain(domain: string) {
    setCollapsedDomains(previous => {
      const next = new Set(previous);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  return (
    <section className={styles.surface} data-layout={layout} data-list-scroll-boundary={layout === 'home' ? '' : undefined}
      style={{ height: `calc(100vh - ${viewportOffset}px)` }} aria-label="Примеры карточек отчётов">
      <div className={styles.scroll} data-report-card-scroll data-list-scroll style={{ paddingBottom: bottomReserve }}>
        {reports.length === 0 && <p role="status">По выбранным условиям отчёты не найдены.</p>}
        {!groupByDomain && <div className={styles.grid} data-layout={layout} data-flat>
          {reports.map(report => <ReportCard key={report.id} report={report} onOpen={onOpen} onEdit={onEdit} showDomain={false} />)}
        </div>}
        {Array.from(groups, ([domain, items]) => {
          const collapsed = collapsedDomains.has(domain);
          const contentId = `${groupId}-${encodeURIComponent(domain)}`;
          return <section className={styles.group} key={domain} aria-label={`Домен «${domain}»`} data-collapsed={collapsed}>
            <h2 className={styles.heading}>
              <button type="button" className={styles.groupToggle} aria-expanded={!collapsed} aria-controls={contentId} onClick={() => toggleDomain(domain)}>
                <img src="/icons/reports/domain-group.svg" width="16" height="16" alt="" aria-hidden="true" />
                <span>{domain}</span><span className={styles.count} aria-label={`${items.length} ${items.length === 1 ? 'позиция' : 'позиций'}`}>{items.length}</span>
                <span className={motion.groupChevron} data-group-chevron aria-hidden="true" />
              </button>
            </h2>
            <div id={contentId} className={motion.reveal} data-open={!collapsed} aria-hidden={collapsed} inert={collapsed}>
              <div className={`${motion.clip} ${styles.groupClip}`}>
                <div className={styles.grid} data-layout={layout}>
                  {items.map((report) => <ReportCard key={report.id} report={report} onOpen={onOpen} onEdit={onEdit} showDomain={false} />)}
                </div>
              </div>
            </div>
          </section>;
        })}
      </div>
    </section>
  );
}
