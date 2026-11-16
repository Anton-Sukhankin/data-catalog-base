import type { ReportSummary } from '@data-catalog/ui/source/data/reports';
import type { ReportDetailContent } from '@data-catalog/ui/source/features/report-detail/source';

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
      guid: '9609591d4baf423a8f048655b3744d83',
      name: 'Навес свод и детализация',
      lastEditor: 'admin',
      updatedAt: '30.10.2026, 16:54:29',
      portal: true,
      publicLink: false,
    },
    workspace: { guid: '2716a879-958a-4552-8742-b1f8a5222852', name: 'Строительство' },
    datasets: {
      datasetGuids: ['062e9c29-b0dc-4d7f-9345-58910bc8e552'],
      sourceGuids: ['64a17810-33b0-4800-a437-6d3fd7103d72'],
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
