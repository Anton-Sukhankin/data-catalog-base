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
  synchronizedLabel?: string;
  domain?: string;
  masterSystem?: string;
  analyst?: string;
  technicalOwner?: string;
  fields?: readonly SourceField[];
  counts: { reports?: number; metrics?: number; mcp?: number; similar?: number };
  /** undefined means a list was not provided; [] is a known empty list. */
  relatedReports?: readonly { id: string; title: string }[];
  provenance: { kind:'demo'; reference:string; fieldsPartial:boolean; demoFieldNames?:readonly string[] };
}
export interface SourceDetailsGateway { read(id:string):SourceDetailData | undefined }
