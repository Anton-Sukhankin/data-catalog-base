import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiHubCatalog, DictionaryWorkspace, MetricWorkspace, SystemReferencesWorkspace, TasksWorkspace, type AiSolution, type DictionaryGateway, type MetricSummary, type SystemReferencesGateway } from '../src';

const meta = { title: 'Screens/Catalog workspaces' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const solution: AiSolution = { id: 'demo', title: 'Помощник аналитика', description: 'Готовит краткую сводку по выбранному набору данных.', type: 'ИИ-утилита', domain: 'Аналитика', status: 'Используется', platform: 'Web', flags: ['ui'], views: 12, likes: 3, actions: {} };
const metric: MetricSummary = { id: 'sales', title: 'Количество сделок', description: 'Завершённые сделки за период.', type: 'Метрика', status: 'Проверена', domain: 'Продажи', unit: 'шт.', updated: '2026-11-12' };
const dictionary: DictionaryGateway = { read: () => ({
  terms: [{ id: 'period', name: 'Отчётный период', type: 'Бизнес-термин', status: 'Утверждён', description: 'Интервал, за который составляется отчёт.', descriptionComplete: true, domain: 'Аналитика' }],
  domains: [{ id: 'analytics', name: 'Аналитика' }], provenance: { kind: 'demo', reference: 'Storybook' },
}) };
const references: SystemReferencesGateway = {
  list: () => [{ id: 'crm', title: 'Справочник CRM', label: 'CRM', system: { name: 'CRM' } }],
  rows: () => [{ id: 'region', entity: { name: 'Сделка', logicalName: 'sale' }, attribute: { name: 'Регион', logicalName: 'region' }, relationships: [], options: [{ code: 'north', label: 'Север' }] }],
};

function AiCatalog() {
  const [saved, setSaved] = useState(new Set<string>());
  return <AiHubCatalog items={[solution]} scrollPosition={useRef(0)} bookmarks={saved} onModalChange={() => {}} onBookmark={id => setSaved(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  })} />;
}

function Tasks() {
  const [openedReport, setOpenedReport] = useState('');
  return <>
    <TasksWorkspace tasks={[{ id: 'weekly', title: 'Согласовать рассылку', reportId: 'sales', reportTitle: 'Динамика продаж', requestedBy: 'Команда аналитики', requestedAt: '2026-11-12T09:00:00Z' }]} onOpenReport={setOpenedReport} />
    {openedReport && <p role="status">Открыт отчёт «Динамика продаж».</p>}
  </>;
}

export const AiHub: Story = { name: 'AI Hub', render: () => <AiCatalog /> };
export const Dictionary: Story = { name: 'Бизнес-словарь', render: () => <DictionaryWorkspace gateway={dictionary} /> };
export const Metrics: Story = { name: 'Метрики и показатели', render: () => <MetricWorkspace gateway={{ list: () => [metric], read: id => id === metric.id ? metric : undefined, readDetail: () => undefined }} onSubmitQuestion={() => {}} /> };
export const References: Story = { name: 'Справочники ИС', render: () => <SystemReferencesWorkspace gateway={references} /> };
export const MailingTasks: Story = { name: 'Задачи с переходом к отчёту', render: () => <Tasks /> };
