import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColumnFilterMenu, SourceCards, SourceDetail, SourceLineageGraph, SourceTable, SourceTree, type SourceDetailTab } from '../src';
import type { SourceSummary } from '../src/data/sources';

const meta = { title: 'Screens/Source catalog', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const rows: SourceSummary[] = [
  { id: 'calendar', technicalName: 'demo.public.calendar', platform: 'PostgreSQL', layer: 'Clean', storageContext: 'Demo', description: 'Календарь отчётных периодов.', objectType: 'Table', columns: 8, domain: 'Продажи', reports: 2, metrics: 0, mcp: 0, provenance: 'demo', treePath: ['Demo', 'public'] },
  { id: 'regions', technicalName: 'demo.public.regions', platform: 'PostgreSQL', layer: 'Clean', storageContext: 'Demo', objectType: 'Table', columns: 4, domain: 'Операции', reports: 0, metrics: 0, mcp: 0, provenance: 'demo', treePath: ['Demo', 'public'] },
];

function Catalog({ view }: { view: 'list' | 'cards' | 'tree' }) {
  const [notice, setNotice] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [closedKeys, setClosedKeys] = useState<readonly string[]>([]);
  const [bookmarks, setBookmarks] = useState(new Set<string>());
  const [column, setColumn] = useState<string>();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [direction, setDirection] = useState<'asc' | 'desc'>();
  const options = rows.map(row => ({ value: row.domain, label: row.domain }));
  const visible = rows.filter(row => domains.length === 0 || domains.includes(row.domain));
  if (direction) visible.sort((a, b) => a.domain.localeCompare(b.domain, 'ru') * (direction === 'asc' ? 1 : -1));
  const onOpen = (row: SourceSummary) => setNotice(`Открыт источник ${row.technicalName}`);
  return <div style={{ padding: 24, position: 'relative' }}>
    {notice && <p role="status">{notice}</p>}
    {view === 'tree' && <SourceTree rows={rows} activeKey={activeKey} closedKeys={closedKeys} bookmarks={bookmarks} onOpen={onOpen}
      onChange={(active, closed) => { setActiveKey(active); setClosedKeys(closed); }}
      onBookmark={id => setBookmarks(current => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      })} />}
    {view === 'cards' && <SourceCards rows={rows} onOpen={onOpen} onNotice={setNotice} />}
    {view === 'list' && <>
      <SourceTable rows={visible} filters={{ domain: domains }} activeColumn={column} onOpen={onOpen} onNotice={setNotice}
        onColumn={id => { if (id === 'domain') { setColumn(id); setDraft(domains); } }} onClear={() => { setDomains([]); setDirection(undefined); }} />
      {column && <div style={{ position: 'absolute', right: 24, top: 80, width: 320, zIndex: 1 }}>
        <ColumnFilterMenu label="Домен" options={options.filter(option => option.label.toLowerCase().includes(query.toLowerCase()))}
          totalOptionsCount={options.length} selectedValues={draft} searchValue={query} onSearchChange={setQuery} sortDirection={direction}
          onSortChange={setDirection} onToggleValue={value => setDraft(values => values.includes(value) ? values.filter(item => item !== value) : [...values, value])}
          onReset={() => { setDraft([]); setDirection(undefined); }} onApply={() => { setDomains(draft); setQuery(''); setColumn(undefined); }} />
      </div>}
    </>}
  </div>;
}

export const Cards: Story = { name: 'Карточки источников', render: () => <Catalog view="cards" /> };
export const Table: Story = { name: 'Таблица с фильтром «Домен»', render: () => <Catalog view="list" /> };
export const Tree: Story = { name: 'Дерево источников', render: () => <Catalog view="tree" /> };
export const Lineage: Story = { name: 'Граф Lineage', render: () => <div style={{ height: 480 }}>
  <SourceLineageGraph sourceTitle="demo.public.calendar" reports={[{ id: 'sales', title: 'Продажи' }, { id: 'planning', title: 'Планирование' }]} />
</div> };

function SourcePassport() {
  const [tab, setTab] = useState<SourceDetailTab>('fields');
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState(false);
  return <div style={{ padding: 24, background: '#f3f4f9' }}>
    {notice && <p role="status">Возврат к списку источников</p>}
    <SourceDetail source={rows[0]} tab={tab} onTabChange={setTab} onBack={() => setNotice(true)} saved={saved} onBookmark={() => setSaved(value => !value)}
      detail={{ sourceId: 'calendar', counts: { reports: 1, metrics: 0, similar: 0 },
        fields: [{ name: 'date', sqlType: 'DATE', genericType: 'DateType', nullable: false, key: true, metricCount: 0 }],
        relatedReports: [{ id: 'sales', title: 'Продажи', description: 'Динамика продаж по месяцам.' }],
        lineageReports: [{ id: 'sales', title: 'Продажи' }], similarSources: [],
        provenance: { kind: 'demo', reference: 'Storybook', fieldsPartial: false } }} />
  </div>;
}

export const Passport: Story = { name: 'Паспорт источника', render: () => <SourcePassport /> };
