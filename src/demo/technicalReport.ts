import type { ReportSummary } from '../data/reports';
import type { ReportDetailContent } from '../features/report-detail/source';

export const technicalReportSummary: ReportSummary = {
  // Local navigation key. The dashboard GUID and catalog report ID are distinct.
  id: 'demo-report-canopy',
  type: 'report',
  title: 'Навес свод и детализация',
  domain: '',
  platform: 'Visiology',
  verification: { status: 'verified', reviewer: '—' },
};

// SRC-23 and SRC-24: the captured passport does not supply related item records.
export const technicalReportDetail: ReportDetailContent = {
  confirmedCounts: { slides: 5, metrics: 23, sources: 7 },
  technical: {
    catalog: {
      createdAt: '07.09.2026, 11:37:29',
      updatedAt: '09.11.2026, 12:01:24',
      synchronizedAt: '09.11.2026, 12:01:24',
      verificationStatus: 'Проверена',
      verificationReason: 'Автоматически создано из Visiology',
      dashboardChangeCount: 44,
      creationMethod: 'Автоматически из Visiology',
      managedBySync: true,
      syncSource: 'visiology',
    },
    dashboard: {
      guid: '11111111111141118111111111111111',
      name: 'Навес свод и детализация',
      lastEditor: 'admin',
      updatedAt: '30.10.2026, 16:54:29',
      portal: true,
      publicLink: false,
    },
    workspace: { guid: '22222222-2222-4222-8222-222222222222', name: 'Строительство' },
    datasets: {
      datasetGuids: ['33333333-3333-4333-8333-333333333333'],
      sourceGuids: ['44444444-4444-4444-8444-444444444444'],
      sourceTypes: ['db'],
      tables: [
        'cdm_live_house_accepted_status',
        'cdm_ovp_app_daily_statistics',
        'cdm_placement_agg_current',
        'cdm_section_overhang_daily',
        'cdm_weekly_plan_ovp_appointments_by_section',
        'reports_canopy_plan',
        'zrds_dz',
      ],
    },
  },
};
