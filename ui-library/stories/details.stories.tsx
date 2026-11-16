import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuestionsWorkspace, ReportDetail, type QuestionAppeal, type ReportDetailSources } from '../src';

const meta = { title: 'Screens/Details and FAQ' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const reportSource: ReportDetailSources = {
  read: () => ({
    overview: { description: 'Отчёт показывает динамику продаж по регионам.', businessQuestions: ['Как меняются продажи по месяцам?'] },
    slides: [{ title: 'Сводный', description: 'Динамика по месяцам.', example: [['Период', 'Месяц']] }],
    sources: [],
  }),
  metrics: { read: () => [] },
  mailings: { list: () => [] },
};

function Passport() {
  const [tab, setTab] = useState('overview');
  const [notice, setNotice] = useState('');
  return <>
    {notice && <p role="status">{notice}</p>}
    <ReportDetail report={{ id: 'demo', title: 'Динамика продаж', type: 'report', domain: 'Продажи' }}
      tab={tab} onTabChange={setTab} source={reportSource} onBack={() => setNotice('Возврат к отчётам')} onOpenSource={setNotice} />
  </>;
}

function Faq() {
  const [appeals, setAppeals] = useState<QuestionAppeal[]>([]);
  return <QuestionsWorkspace faq={[{ id: 'open', question: 'Где найти отчёт?', answer: 'Откройте раздел «Отчёты».' }]}
    appeals={appeals} onClearSearch={() => {}} onSubmitQuestion={draft => setAppeals(current => [
      { ...draft, id: String(current.length + 1), status: 'new', lastMessageAt: new Date().toISOString() }, ...current,
    ])} />;
}

export const ReportPassport: Story = { name: 'Паспорт отчёта', render: () => <Passport /> };
export const Questions: Story = { name: 'FAQ и мои вопросы', render: () => <Faq /> };
