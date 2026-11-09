import styles from './ContributorCard.module.css';

export interface ContributorMetric {
  label: string;
  value: string;
}

export interface ContributorCardData {
  id: string;
  rankLabel: string;
  name: string;
  roleLabel: string;
  jobTitle: string;
  department: string;
  metrics: readonly [ContributorMetric, ContributorMetric, ContributorMetric, ContributorMetric];
}

export interface ContributorCardProps {
  contributor: ContributorCardData;
  variant?: 'standalone' | 'joined';
}

export function ContributorCard({ contributor, variant = 'standalone' }: ContributorCardProps) {
  return (
    <article className={`${styles.card} ${variant === 'joined' ? styles.joined : styles.standalone}`}
      data-contributor-id={contributor.id} aria-label={contributor.name}>
      <header className={styles.header}>
        <span className={styles.rank} aria-label={`Место ${contributor.rankLabel}`}>{contributor.rankLabel}</span>
        <div className={styles.person}>
          <div className={styles.nameAndRole}>
            <h3 className={styles.name}>{contributor.name}</h3>
            <span className={styles.role}>{contributor.roleLabel}</span>
          </div>
          <div className={styles.affiliation}>
            <span className={styles.jobTitle}>{contributor.jobTitle}</span>
            <img src="/images/contributors/separator.svg" width="3" height="3" alt="" aria-hidden="true" />
            <span className={styles.department}>{contributor.department}</span>
          </div>
        </div>
      </header>
      <dl className={styles.metrics}>
        {contributor.metrics.map((metric, index) => (
          <div className={styles.metric} key={index}>
            <dt className={styles.metricLabel}>{metric.label}</dt>
            <dd className={styles.metricValue}>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
