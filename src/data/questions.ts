export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export const appealStatuses = {
  new: 'Новый',
  inProgress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
} as const;

export type AppealStatus = keyof typeof appealStatuses;
export type AppealFilter = AppealStatus | 'all';

export interface QuestionAppeal {
  id: string;
  subject: string;
  message: string;
  status: AppealStatus;
  lastMessageAt: string;
}

export type QuestionDraft = Pick<QuestionAppeal, 'subject' | 'message'>;
