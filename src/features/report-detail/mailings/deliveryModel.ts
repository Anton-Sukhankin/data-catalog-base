export const deliveryChannels = [
  { id: 'mail', title: 'Почта', fields: ['mail'] },
  { id: 'talk', title: 'Контур.Толк', fields: ['talkPeople', 'talkGroups'] },
] as const;

export const recipientFields = {
  mail: { label: 'Получатели почты', placeholder: 'Найти сотрудника или группу' },
  talkPeople: { label: 'Сотрудники Контур.Толка', placeholder: 'Найти сотрудника' },
  talkGroups: { label: 'Группы и каналы Контур.Толка', placeholder: 'Найти группу или канал' },
} as const;

export const attachmentFields = {
  format: { label: 'Формат', options: ['PNG', 'PDF', 'PPTX'] },
  orientation: { label: 'Ориентация', options: ['Portrait', 'Landscape'] },
  pageType: { label: 'Тип страницы', options: ['Quarto', 'PK', 'Legal', 'original'] },
} as const;

export const sheetModes = [
  { id: 'values', label: 'По значениям' },
  { id: 'guid', label: 'По GUID' },
  { id: 'defaults', label: 'Фильтры по умолчанию' },
] as const;

export type DeliveryChannel = typeof deliveryChannels[number]['id'];
export type RecipientField = keyof typeof recipientFields;
export type AttachmentField = keyof typeof attachmentFields;
type SheetMode = typeof sheetModes[number]['id'];
export type ChannelDraft = Record<AttachmentField, string> & { self: boolean; archive: boolean };

export interface ManualDeliveryData {
  recipients: Record<RecipientField, readonly { value: string; label: string }[]>;
  sheets: readonly { id: string; title: string }[];
}

export interface ManualDeliveryDraft {
  channels: Record<DeliveryChannel, ChannelDraft>;
  recipients: Record<RecipientField, readonly string[]>;
  sheets: readonly string[];
  modes: Record<SheetMode, boolean>;
}

export const sheetDescription = 'Пустой срез оставляет значение дашборда. Списки одной таблицы сужаются по выбранным значениям.';

export function initialDelivery(data: ManualDeliveryData): ManualDeliveryDraft {
  return {
    channels: {
      mail: { self: true, archive: false, format: 'PDF', orientation: 'Landscape', pageType: 'original' },
      talk: { self: false, archive: false, format: 'PNG', orientation: 'Landscape', pageType: 'original' },
    },
    recipients: { mail: [], talkPeople: [], talkGroups: [] },
    sheets: data.sheets.map(sheet => sheet.id),
    modes: { values: true, guid: false, defaults: false },
  };
}

export function summarizeDelivery(data: ManualDeliveryData, draft: ManualDeliveryDraft) {
  return deliveryChannels.flatMap(({ id, title, fields }) => {
    const recipients = draft.channels[id].self ? ['себе'] : [];
    for (const field of fields) {
      recipients.push(...data.recipients[field].filter(option => draft.recipients[field].includes(option.value)).map(option => option.label));
    }
    return recipients.length ? [`${title} — ${recipients.join(', ')}`] : [];
  });
}

export function isDeliveryChanged(initial: ManualDeliveryDraft, draft: ManualDeliveryDraft) {
  return draft.sheets.length !== initial.sheets.length
    || Object.values(draft.recipients).some(values => values.length > 0)
    || sheetModes.some(({ id }) => draft.modes[id] !== initial.modes[id])
    || deliveryChannels.some(({ id }) => Object.entries(initial.channels[id]).some(
      ([key, value]) => draft.channels[id][key as keyof ChannelDraft] !== value,
    ));
}
