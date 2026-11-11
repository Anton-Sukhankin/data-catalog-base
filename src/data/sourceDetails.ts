import type { MetricDetailIdentity } from './metrics';

export type SourceDetailTab = 'fields' | 'reports' | 'metrics' | 'lineage' | 'similar';

export function readSourceDetailTab(value: string | null): SourceDetailTab {
  return value === 'reports' || value === 'metrics' || value === 'lineage' || value === 'similar' ? value : 'fields';
}

export interface SourceField {
  name: string; sqlType: string; genericType: string; nullable: boolean; key: boolean;
  /** undefined is unknown, not a zero count. */
  metricCount?: number;
  /** When supplied, this list is authoritative for the field badge. */
  relatedMetrics?: readonly string[];
}
export interface SourceDetailData {
  sourceId: string;
  technicalStatus?: string;
  /** Observed values available in the description without changing header or tab metadata. */
  aboutMetadata?: { technicalStatus?: string; similarSourceCount?: number };
  synchronizedLabel?: string;
  domain?: string;
  masterSystem?: string;
  analyst?: string;
  technicalOwner?: string;
  fields?: readonly SourceField[];
  counts: { reports?: number; metrics?: number; mcp?: number; similar?: number };
  /** undefined means a list was not provided; [] is known empty; a nonempty list may be partial. */
  relatedReports?: readonly { id: string; title: string; description?: string; descriptionUnavailable?: string }[];
  /** A fragment of the source-wide metrics list, separate from metrics of any one field. */
  relatedMetrics?: readonly MetricDetailIdentity[];
  /** Observed report nodes from the source's Lineage view. The available fragment may be partial. */
  lineageReports?: readonly { id: string; title: string }[];
  /** Visible results may be a fragment of the total in counts.similar. */
  similarSources?: readonly { technicalName: string; businessMetricCount: number }[];
  provenance: { kind:'demo'; reference:string; fieldsPartial:boolean; demoFieldNames?:readonly string[] };
}
export interface SourceDetailsGateway { read(id:string):SourceDetailData | undefined }
