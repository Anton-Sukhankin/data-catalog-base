import { describe, expect, it } from 'vitest';
import { demoSourcesGateway } from '../demo/sources';
import { demoSourceDetailsGateway, rewedoSourceId } from '../demo/sourceDetails';
describe('source detail identity and evidence',()=>{
  it('joins every catalog identity to its own complete schema without fallback to another source',()=>{
    const records=demoSourcesGateway.list();
    expect(records).toHaveLength(9);
    const item=records.find(row=>row.id===rewedoSourceId)!;
    expect(item.technicalName).toBe('rewedo_crm_production.public.versions');
    expect(demoSourceDetailsGateway.read(item.id)?.sourceId).toBe(item.id);
    const schemaSignatures=new Set<string>();
    for(const row of records) {
      const detail=demoSourceDetailsGateway.read(row.id)!;
      expect(detail.sourceId).toBe(row.id);
      expect(detail.fields).toHaveLength(row.columns);
      expect(new Set(detail.fields!.map(field=>field.name)).size).toBe(row.columns);
      expect(detail.fields!.some(field=>field.key&&!field.nullable)).toBe(true);
      expect(detail.counts.reports).toBe(row.reports);
      expect(detail.provenance.fieldsPartial).toBe(false);
      expect(detail.provenance.demoFieldNames?.length).toBeGreaterThan(0);
      expect(row.description?.length).toBeGreaterThan(100);
      expect(row.demoAttributes).toContain('description');
      expect(detail.domain).toBe(row.domain);
      expect(detail.masterSystem).toBe(row.masterSystem);
      expect(detail.analyst).toBe(row.analyst);
      for(const value of [detail.domain,detail.masterSystem,detail.analyst,detail.technicalOwner]) {
        expect(value?.trim()).toBeTruthy();
        expect(['—','Не указан','Описание отсутствует']).not.toContain(value);
      }
      schemaSignatures.add(detail.fields!.map(field=>field.name).join(','));
    }
    expect(schemaSignatures.size).toBe(records.length);
    expect(new Set(records.map(row=>row.description)).size).toBe(records.length);
    expect(demoSourceDetailsGateway.read('demo.requests')).toBeUndefined();
    expect(demoSourceDetailsGateway.read('unknown')).toBeUndefined();
  });
  it('preserves the six supplied fields and marks only the two added demo columns, retaining unknown metric counts',()=>{
    const detail=demoSourceDetailsGateway.read(rewedoSourceId)!;
    expect(detail.fields).toHaveLength(8);
    expect(detail.fields!.slice(0,6).map(field=>field.name)).toEqual(['id','item_type','item_id','event','whodunnit','object']);
    expect(detail.fields!.slice(0,3).map(field=>field.metricCount)).toEqual([0,0,0]);
    expect(detail.fields!.slice(3).every(field=>field.metricCount===undefined)).toBe(true);
    expect(detail.relatedReports).toEqual([]);
    expect(detail.provenance.demoFieldNames).toEqual(['created_at','object_changes']);
    expect(demoSourcesGateway.list().find(row=>row.id===rewedoSourceId)?.views).toBeUndefined();
  });
});
