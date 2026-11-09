import type { ReportDataSource, ReportLineage } from './model';

const demoPlatforms = {
  mssql: 'Демо SQL',
  postgres: 'Демо PostgreSQL',
};

export function demoReportSource(
  name: `${string}.${string}.${string}`,
  platform: keyof typeof demoPlatforms,
  fieldCount: number,
  environment: 'DEV' | 'TEST' = 'DEV',
): ReportDataSource {
  const [database, schema] = name.split('.');
  return {
    id: name,
    name,
    category: 'datahub',
    platform: demoPlatforms[platform],
    database,
    schema,
    environment,
    status: 'Активен',
    fieldCount,
    urn: `urn:li:dataset:(urn:li:dataPlatform:${platform},${name},${environment})`,
  };
}

/** Approved Paper screen 07 fixture, 4 November 2026. Not report 193 or live DataHub data.
 * Five entries and the catalog assignment of two entries are design examples only.
 * The previous eight-name fixture is retained in the evidence baseline, not truncated at runtime.
 */
export const paperSources: readonly ReportDataSource[] = [
  { id:'requests', name:'demo.requests', category:'datahub', platform:'Демо SQL', database:'demo_catalog', schema:'demo', environment:'DEV', status:'Активен', fieldCount:24, urn:'urn:li:dataset:(urn:li:dataPlatform:mssql,demo_catalog.demo.requests,DEV)' },
  { ...demoReportSource('demo_catalog.demo.events', 'postgres', 18, 'TEST'), id: 'events', name: 'demo.events' },
  { ...demoReportSource('demo_reference.demo.teams', 'mssql', 9), id: 'teams', name: 'demo.teams' },
  {
    id: 'services', name: 'demo.services', category: 'catalog', platform: 'Демо SQL',
    database: 'demo_reference', schema: 'demo', environment: 'DEV', status: 'Активен',
    fieldCount: 12, urn: 'urn:demo:catalog:demo_reference.demo.services',
  },
  {
    id: 'locations', name: 'demo.locations', category: 'catalog', platform: 'Демо PostgreSQL',
    database: 'demo_geo', schema: 'demo', environment: 'TEST', status: 'Активен',
    fieldCount: 15, urn: 'urn:demo:catalog:demo_geo.demo.locations',
  },
];

export const paperLineage: ReportLineage = {
  nodes:[
    {sourceId:'requests',x:24,y:220}, {sourceId:'events',x:375,y:220},
    {sourceId:'teams',x:726,y:220}, {sourceId:'services',x:199.5,y:350},
    {sourceId:'locations',x:550.5,y:350},
  ],
  edges:paperSources.map(source=>({sourceId:source.id})),
};
