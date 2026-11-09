import type { SubscriptionCardData } from './SubscriptionCard';

// Display values transcribed from group 1366:40376. IDs are preview identities,
// not backend identifiers. The component never imports these fixtures.
export const previewSubscriptions: readonly SubscriptionCardData[] = [
  {
    id: 'subscription-receivables', title: 'Дебиторская задолженность', typeLabel: 'Отчёты', statusLabel: 'Включена',
    report: { id: 'report-receivables', title: 'Отчёт по дебиторской задолженности' },
    nextDeliveryText: '10.10.2026, 10:00:00', channelLabel: 'Контур.Толк', botActionLabel: 'Напишите боту',
  },
  {
    id: 'subscription-occupancy', title: 'Заселение объектов', typeLabel: 'Отчёты', statusLabel: 'Включена',
    report: { id: 'report-occupancy-dynamics', title: 'Динамика заселения' },
    nextDeliveryText: '11.10.2026, 09:00:00', channelLabel: 'Контур.Толк', botActionLabel: 'Напишите боту',
  },
  {
    id: 'subscription-quarter-summary', title: 'Сводка за квартал', typeLabel: 'Отчёты', statusLabel: 'Включена',
    report: { id: 'report-hospitality-summary', title: 'Сводный отчёт Гостеприимства' },
    nextDeliveryText: '16.10.2026, 10:00:00', channelLabel: 'Контур.Толк', botActionLabel: 'Напишите боту',
  },
];

export const previewMaster: SubscriptionCardData = {
  id: 'subscription-sales-today', title: 'Мои продажи сегодня', typeLabel: 'Отчёты', statusLabel: 'Включена',
  report: { id: 'report-mop-profile', title: 'Профайл МОП' },
  nextDeliveryText: '06.10.2026, 09:00:00', channelLabel: 'Контур.Толк', botActionLabel: 'Напишите боту',
};
