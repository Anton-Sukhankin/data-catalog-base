import { describe, expect, it } from 'vitest';
import { demoSourcesGateway } from '../demo/sources';
import { filterSources, readSourceFilters, sourceFilterCount, sourceFiltersEqual, sourceOptions, toggleSourceFilter, writeSourceFilters } from './sources';
const rows = demoSourcesGateway.list();
describe('source catalog conditions',()=>{
  it('combines values with OR and attributes with AND',()=>{
    expect(filterSources(rows,{domain:['Продажи и маркетинг','Гостеприимство']})).toHaveLength(9);
    expect(filterSources(rows,{domain:['Гостеприимство'],personalData:['no']} ).map(row=>row.technicalName)).toEqual(['demo.service.feedback']);
    expect(filterSources(rows,{analytics:['yes'],description:['yes']})).toHaveLength(3);
    expect(filterSources(rows,{description:['no']})).toHaveLength(0);
    expect(filterSources([{...rows[0],description:undefined}],{description:['no']})).toHaveLength(1);
  });
  it('does not equate missing source facts with a negative answer',()=>{
    const source = {...rows[0],masterSystem:undefined};
    expect(filterSources([source],{personalData:['no']})).toHaveLength(0);
    expect(filterSources([source],{similar:['yes']})).toHaveLength(0);
    expect(filterSources([source],{masterSystem:['Reportcrm20']})).toHaveLength(0);
    expect(filterSources([source],{})).toHaveLength(1);
  });
  it('counts attributes, not selected values, and treats an empty choice as unrestricted',()=>{
    expect(sourceFilterCount({domain:['Продажи и маркетинг','Гостеприимство'],layer:['Без слоя']})).toBe(2);
    expect(sourceFiltersEqual({domain:[]},{})).toBe(true);
    expect(sourceFiltersEqual({domain:['a','b']},{domain:['b','a']})).toBe(true);
    expect(toggleSourceFilter({personalData:['yes']},'personalData','no')).toEqual({personalData:['no']});
    expect(toggleSourceFilter({platform:['SQL Server']},'platform','SQL Server')).toEqual({platform:undefined});
  });
  it('keeps supported positive-only conditions and derives categorical options from metadata',()=>{
    expect(sourceOptions(rows,'analytics').map(item=>item.value)).toEqual(['yes']);
    expect(sourceOptions(rows,'similar').map(item=>item.value)).toEqual(['yes']);
    expect(new Set(sourceOptions(rows,'masterSystem').map(item=>item.value))).toEqual(new Set(['Демо CRM','Демо сервис','CRM (CRM Dynamics)','ReportCRM','Хранилище данных DWH CRM','Управление проектами']));
  });
  it('roundtrips safe URL conditions and rejects invalid, duplicated and conflicting single choices',()=>{
    const url = new URLSearchParams('section=sources&sourceView=cards&sourcePage=9&source.analytics=no&source.personalData=yes&source.personalData=no');
    expect(readSourceFilters(url,rows)).toEqual({personalData:['yes']});
    const next = writeSourceFilters(url,{domain:['Гостеприимство'],description:['yes']});
    expect(next.get('sourceView')).toBe('cards');
    expect(next.has('sourcePage')).toBe(false);
    expect(next.has('source.analytics')).toBe(false);
    expect(readSourceFilters(next,rows)).toEqual({domain:['Гостеприимство'],description:['yes']});
  });
});
