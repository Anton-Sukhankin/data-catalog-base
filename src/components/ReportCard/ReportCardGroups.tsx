import type { ReportSummary } from '../../data/reports';
import { ReportCard, type ReportCardData } from './ReportCard';
import styles from './ReportCardGroups.module.css';

export function ReportCardGroups({ reports, onOpen, onEdit, viewportOffset = 108, bottomReserve = 32, layout = 'home' }: {
  reports: readonly ReportCardData[];
  onOpen: (report: ReportSummary) => void;
  onEdit: (report: ReportSummary) => void;
  viewportOffset?: number;
  bottomReserve?: number;
  layout?: 'home' | 'catalog';
}) {
  const groups = new Map<string, ReportCardData[]>();
  for (const report of reports) {
    const domain = report.domainGroup ?? report.domain;
    const group = groups.get(domain);
    if (group) group.push(report);
    else groups.set(domain, [report]);
  }
  return (
    <section className={styles.surface} data-layout={layout} data-list-scroll-boundary={layout === 'home' ? '' : undefined}
      style={{ height: `calc(100vh - ${viewportOffset}px)` }} aria-label="Примеры карточек отчётов">
      <div className={styles.scroll} data-report-card-scroll data-list-scroll style={{ paddingBottom: bottomReserve }}>
        {reports.length === 0 && <p role="status">По выбранным условиям отчёты не найдены.</p>}
        {Array.from(groups, ([domain, items]) => (
          <section className={styles.group} key={domain} aria-label={`Домен «${domain}»`}>
            <h2 className={styles.heading}>
              <img src="/icons/reports/domain-group.svg" width="16" height="16" alt="" aria-hidden="true" />
              <span>{domain}</span><span className={styles.count} aria-label={`${items.length} ${items.length === 1 ? 'позиция' : 'позиций'}`}>{items.length}</span>
            </h2>
            <div className={styles.grid} data-layout={layout}>
              {items.map((report) => <ReportCard key={report.id} report={report} onOpen={onOpen} onEdit={onEdit} showDomain={false} />)}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
