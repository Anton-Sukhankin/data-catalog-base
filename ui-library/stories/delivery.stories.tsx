import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MailingsTab, ManualDelivery } from '../src';
import type { ManualDeliveryData, ManualDeliveryDraft } from '../src/features/report-detail/mailings/deliveryModel';

const meta = { title: 'Screens/Report delivery' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const data: ManualDeliveryData = {
  recipients: { mail: [{ value: 'analytics', label: 'Команда аналитики' }], talkPeople: [], talkGroups: [{ value: 'demo', label: 'Демо-канал' }] },
  sheets: [{ id: 'summary', title: 'Сводный' }, { id: 'details', title: 'Детализация' }],
};

function Delivery() {
  const [draft, setDraft] = useState<ManualDeliveryDraft>();
  const [sent, setSent] = useState(false);
  return <>
    <ManualDelivery data={data} draft={draft} onChange={change => { setSent(false); setDraft(change); }} onSend={() => setSent(true)} />
    {sent && <p role="status">Демонстрационная отправка выполнена.</p>}
  </>;
}

export const Manual: Story = { name: 'Разовая отправка отчёта', render: () => <Delivery /> };
export const Schedule: Story = {
  name: 'Расписание и способы получения',
  render: () => <MailingsTab reportId="demo" source={{
    list: () => [{ id: 'weekly', name: 'Еженедельная сводка', subscribed: false, dateTime: '2026-11-12T09:00:00', displayDate: '12.11.2026, 09:00' }],
    manual: () => data,
  }} />,
};
