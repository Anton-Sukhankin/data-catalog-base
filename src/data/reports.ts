export type ReportVerification = { status: 'verified'; reviewer: string } | { status: 'unverified' };

export interface ReportSummary {
  id: string;
  type: 'report';
  title: string;
  /** Short label used by the documented favorite-card presentation. */
  cardTitle?: string;
  domain: string;
  domainGroup?: string;
  platform?: string;
  masterSystem?: string;
  verification?: ReportVerification;
}

export interface ReportsGateway {
  list(signal?: AbortSignal): Promise<ReportSummary[]>;
}

export function searchReports(reports: readonly ReportSummary[], query: string): ReportSummary[] {
  const normalized = query.trim().toLocaleLowerCase('ru');
  if (!normalized) return [];
  return reports.filter((report) => [report.title, report.domain, report.platform, report.masterSystem]
    .some((value) => value?.toLocaleLowerCase('ru').includes(normalized)));
}
