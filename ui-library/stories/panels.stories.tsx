import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiAssistant, AskQuestionButton, AskQuestionDialog, DetailBreadcrumbs, RoundIconButton, Sidebar } from '../src';

const meta = { title: 'Components/Navigation and panels' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Navigation() {
  const [active, setActive] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const icon = new URL('../src/assets/icons/sidebar/sources.svg', import.meta.url).href;
  return <div style={{ display: 'flex', height: 500 }}>
    <Sidebar items={[{ id: 'overview', label: 'Обзор', icon }, { id: 'sources', label: 'Источники', icon, count: '12' }]} activeId={active} collapsed={collapsed} onSelect={setActive} onCollapsedChange={setCollapsed} />
    <div style={{ padding: 20 }}>
      <DetailBreadcrumbs ancestors={[{ label: 'Обзор', onSelect: () => setActive('overview') }]} current={active === 'overview' ? 'Главная' : 'Источники'} />
      <RoundIconButton icon="bookmark" aria-label="Закладка" />
    </div>
  </div>;
}

function QuestionForm() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const opener = useRef<HTMLButtonElement>(null);
  return <>
    <AskQuestionButton ref={opener} onClick={() => setOpen(true)} />
    {open && <AskQuestionDialog opener={opener.current} onClose={() => { setOpen(false); opener.current?.focus(); }} onSubmit={draft => setSubject(draft.subject)} />}
    {subject && <p role="status">Принято: {subject}</p>}
  </>;
}

export const SideMenu: Story = { name: 'Боковая панель и хлебные крошки', render: () => <Navigation /> };
export const Question: Story = { name: 'Форма вопроса с вложениями', render: () => <QuestionForm /> };
export const Assistant: Story = { name: 'AI-ассистент', render: () => <div style={{ minHeight: 500 }}>
  <AiAssistant requestReply={text => ({ text: `Получен вопрос: ${text}` })} />
</div> };
