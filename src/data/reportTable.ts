import type { ReportSummary } from './reports';

export interface ReportTableRow {
  id: string;
  report: ReportSummary;
  title: string;
  mau: string;
  delta: string;
  chartSrc: string;
  platform: string;
  domain: string;
  masterSystem: string;
  owner: string;
  avatarSrc: string;
  lastViewed: string;
  verifiedIndicator: boolean;
  warningIndicator: boolean;
}

export const reportTableMinimums = [132, 140, 180, 180, 200, 120] as const;
export function reportTableLayout(width: number) {
  const extra = Math.max(0, width - 1376) / 6;
  const middle = reportTableMinimums.map((minimum) => minimum + extra);
  return { report: 360, edit: 64, middle, middleWidth: middle.reduce((sum, value) => sum + value, 0), overflow: Math.max(0, 1376 - width) };
}

export { paginate as reportTablePage } from './pagination';
