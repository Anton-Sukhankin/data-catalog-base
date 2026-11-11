export interface ReportTechnicalContent {
  catalog: {
    createdAt?: string;
    updatedAt?: string;
    synchronizedAt?: string;
    verificationStatus?: string;
    verificationReason?: string;
    dashboardChangeCount?: number;
    creationMethod?: string;
    managedBySync?: boolean;
    syncSource?: string;
  };
  dashboard: {
    guid?: string;
    name?: string;
    lastEditor?: string;
    reportCreatedAt?: string;
    updatedAt?: string;
    portal?: boolean;
    publicLink?: boolean;
  };
  workspace: { guid?: string; name?: string };
  datasets: {
    datasetGuids?: readonly string[];
    datasetNames?: readonly string[];
    sourceGuids?: readonly string[];
    sourceTypes?: readonly string[];
    tables?: readonly string[];
  };
}
