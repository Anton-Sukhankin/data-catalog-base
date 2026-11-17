import { AttributeValue } from '../AttributeValue/AttributeValue';
import { RoundIconButton } from '../RoundIconButton/RoundIconButton';
import { OverflowText } from '../OverflowText/OverflowText';
import { DescriptionText } from '../DescriptionText/DescriptionText';
import type { ReportSummary, ReportVerification } from '../../data/reports';
import styles from './ReportCard.module.css';

export type ReportCardData = ReportSummary & { verification: ReportVerification };

export function ReportCard({ report, onOpen, onEdit, showDomain = true }: {
  report: ReportCardData;
  onOpen: (report: ReportSummary) => void;
  onEdit: (report: ReportSummary) => void;
  showDomain?: boolean;
}) {
  const verified = report.verification.status === 'verified';
  return (
    <article className={styles.card} data-card-report-id={report.id}>
      <button type="button" className={styles.open} aria-label={`Открыть отчёт «${report.title}»`} onClick={() => onOpen(report)}>
        <span className={styles.document}>
            <img className={styles.defaultGlyph} data-report-document="default" src={new URL('../../assets/icons/reports/report-document.svg', import.meta.url).href} width="16" height="16" alt="" aria-hidden="true" />
            <img className={styles.hoverGlyph} data-report-document="hover" src={new URL('../../assets/icons/reports/report-document-hover.svg', import.meta.url).href} width="16" height="16" alt="" aria-hidden="true" />
            {verified && <img className={styles.verifiedBadge} src={new URL('../../assets/icons/reports/verified-badge.svg', import.meta.url).href} width="18" height="18" alt="Проверенный отчёт" />}
        </span>
        <span className={styles.information}>
          <OverflowText className={styles.title} data-card-title fullText={report.title}>{report.cardTitle ?? report.title}</OverflowText>
          <span className={styles.description} data-card-description>
            {showDomain && <><span className={styles.domain}><DescriptionText text={report.domain} /></span><span className={styles.separator} aria-hidden="true" /></>}
            {report.verification.status === 'verified'
              ? <span className={styles.verification}><span>Проверено:</span><OverflowText className={styles.descriptionValue} fullText={report.verification.reviewer}><AttributeValue value={report.verification.reviewer} /></OverflowText></span>
              : <span>Не проверено</span>}
          </span>
        </span>
      </button>
      <RoundIconButton icon="edit" className={styles.edit} tooltip="Редактировать отчёт" aria-haspopup="dialog"
        aria-label={`Редактировать отчёт «${report.title}»`} onClick={() => onEdit(report)} />
    </article>
  );
}
