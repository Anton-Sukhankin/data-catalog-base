import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContributionContent, HomeFavoriteCards, NewsContent, SubscriptionsContent } from '../src';
import type { NewsArticle } from '../src/features/news/types';

const meta = { title: 'Screens/Home' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const illustration = new URL('../src/assets/images/news/empty-news.png', import.meta.url).href;
const news: NewsArticle = { id: 'news', label: 'Новое', title: 'Обновление каталога', summary: 'Появился поиск в справочниках.', dateLabel: '12 ноября', dateTime: '2026-11-12', imageSrc: illustration,
  heroSrc: illustration, navigationDateLabel: '12 ноября', contentSource: 'demo', blocks: [{ kind: 'paragraph', text: 'Ищите записи по названию объекта и атрибутам.' }] };

function News() {
  const [selected, setSelected] = useState<string>();
  const [page, setPage] = useState(0);
  return <NewsContent category="all" items={[news]} currentNewsId={selected} pageIndex={page} onPageChange={setPage}
    onRead={setSelected} onBack={() => setSelected(undefined)} onChangeArticle={setSelected} />;
}

function Subscriptions() {
  const [notice, setNotice] = useState('');
  const [active, setActive] = useState(true);
  const items = active ? [{ id: 'summary', domain: 'Продажи', title: 'Сводка по понедельникам', typeLabel: 'Рассылка', statusLabel: 'Активна', report: { id: 'sales', title: 'Продажи' }, nextDeliveryText: '16 ноября, 09:00', channelLabel: 'Почта', botActionLabel: 'Открыть' }] : [];
  return <>
    {notice && <p role="status">{notice}</p>}
    <SubscriptionsContent view="cards" items={items} page={{ index: 0, size: 15, total: items.length }} onIntent={intent => {
      if (intent.kind === 'unsubscribe') setActive(false);
      if (intent.kind === 'open-report') setNotice(intent.report.title);
      if (intent.kind === 'open-bot') setNotice('Выбран канал доставки.');
    }} />
  </>;
}

export const Favorites: Story = { name: 'Избранное', render: () => <HomeFavoriteCards kind="source" pageIndex={0} pageSize={15}
  items={[{ id: 'calendar', title: 'demo.public.calendar', description: 'Календарь отчётных периодов' }]}
  onOpen={() => {}} onPageChange={() => {}} onOpenCatalog={() => {}} /> };
export const HomeNews: Story = { name: 'Новости и чтение', render: () => <News /> };
export const HomeSubscriptions: Story = { name: 'Подписки', render: () => <Subscriptions /> };
export const Contributors: Story = { name: 'Участники', render: () => <ContributionContent view="list" page={{ index: 0, size: 15, total: 1 }}
  items={[{ id: 'demo', rankLabel: '1', name: 'Участник каталога', jobTitle: 'Аналитик', roleLabel: 'Проверяющий', department: 'Аналитика', domain: 'Продажи',
    metrics: [{ label: 'Проверок', value: '12' }, { label: 'Всего', value: '16' }, { label: 'К проверке', value: '4' }, { label: 'Проверено', value: '12' }] }]}
  onIntent={() => {}} /> };
