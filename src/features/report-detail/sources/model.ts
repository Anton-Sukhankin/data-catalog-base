/** UI-facing data only; this is not a backend schema or a discovered topology. */
export interface ReportDataSource {
  id: string;
  name: string;
  category: 'datahub' | 'catalog';
  platform?: string;
  database?: string;
  schema?: string;
  environment?: string;
  status?: string;
  fieldCount?: number;
  urn?: string;
}

export interface ReportLineage {
  /** Positions belong to the displayed graph, independently of source metadata. */
  nodes: readonly { sourceId: string; x: number; y: number }[];
  edges: readonly { sourceId: string }[];
}
