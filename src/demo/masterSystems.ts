export interface MasterSystem { id: string; name: string; count: number }

// Display counts from the Paper snapshot of CMDB. Linked records come from SourcesGateway.
export const demoMasterSystemGroups = [
  { label: '1С', systems: [
    { id: '1c-bit-finance', name: '1С Бит.Финанс', count: 554 },
    { id: '1c-housing', name: '1С ЖКХ', count: 166 },
    { id: '1c-payroll', name: '1С ЗУП', count: 230 },
  ] },
  { label: 'A–C', systems: [
    { id: 'confluence', name: 'Atlassian Confluence', count: 2 },
    { id: 'jira', name: 'Atlassian Jira', count: 133 },
    { id: 'cbr', name: 'cbr.ru', count: 9 },
    { id: 'crm-dynamics', name: 'CRM (CRM Dynamics)', count: 3823 },
    { id: 'crm-p', name: 'CRM.P Закупки', count: 2322 },
  ] },
  { label: 'E–N', systems: [
    { id: 'exponea', name: 'Exponea', count: 1 },
    { id: 'optimacros', name: 'Financial model (Оптимакрос)', count: 6 },
    { id: 'lakehouse', name: 'Lakehouse MCP RK', count: 14 },
    { id: 'microsoft-project', name: 'Microsoft Project', count: 21 },
    { id: 'mindbox', name: 'MindBox', count: 37 },
    { id: 'n8n', name: 'N8N', count: 168 },
    { id: 'naumen-cc', name: 'Naumen CC', count: 158 },
  ] },
] satisfies readonly { label: string; systems: readonly MasterSystem[] }[];

export const demoMasterSystems = demoMasterSystemGroups.flatMap(group => group.systems);
