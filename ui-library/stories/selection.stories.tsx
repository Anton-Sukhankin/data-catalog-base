import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChoiceChip, EmptyState, ListPagination, SearchField, SegmentedControl, SingleSelect, TabControl, ViewPicker, type HomeViewMode } from '../src';

const meta = { title: 'Components/Selection and search' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Selection() {
  const [tab, setTab] = useState('all');
  const [segment, setSegment] = useState('new');
  const [domain, setDomain] = useState('');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(false);
  const [view, setView] = useState<HomeViewMode>('list');
  const [page, setPage] = useState(0);
  return <div style={{ display: 'grid', justifyItems: 'start', gap: 16 }}>
    <TabControl selection={{ ariaLabel: 'Вкладки', selectedId: tab, onChange: setTab, items: [{ id: 'all', label: 'Все', count: 12 }, { id: 'saved', label: 'Избранное', count: 2 }] }} />
    <SegmentedControl selection={{ ariaLabel: 'Статус', selectedId: segment, onChange: setSegment, items: [{ id: 'new', label: 'Новые' }, { id: 'closed', label: 'Закрытые' }] }} />
    <SingleSelect label="Домен" value={domain} onValueChange={setDomain} resetValue="" options={[{ label: 'Все домены', value: '' }, { label: 'Продажи', value: 'sales' }]} />
    <ChoiceChip aria-pressed={active} onClick={() => setActive(value => !value)}>Только проверенные</ChoiceChip>
    <SearchField appearance="local" aria-label="Поиск по списку" placeholder="Поиск по списку" value={query} onValueChange={setQuery} />
    <ViewPicker selection={{ value: view, onChange: setView }} />
    <ListPagination label="Страницы списка" total={37} pageIndex={page} pageSize={15} onPageChange={setPage} />
  </div>;
}

export const Controls: Story = { name: 'Вкладки, чипс, селект, поле и пагинация', render: () => <Selection /> };
export const Empty: Story = { name: 'Пустая выдача со сбросом', render: () => <EmptyState title="Ничего не найдено" description="Измените параметры поиска." action={{ label: 'Сбросить фильтры', onClick: () => {} }} /> };
