import { useEffect, useRef, useState } from 'react';

export type AssistantMode = 'assistant' | 'solution';

export type AssistantMessage =
  | { id: number; kind: 'question'; text: string }
  | { id: number; kind: 'pending' }
  | { id: number; kind: 'answer'; text: string; emphasis?: string };

export interface AssistantChat {
  id: number;
  title: string;
  listed: boolean;
  draft: string;
  mode: AssistantMode;
  messages: AssistantMessage[];
}

const newChatTitle = 'Новая беседа';
const simulatedReplyDelay = 1400;

function emptyChat(id: number, listed = false): AssistantChat {
  return { id, title: newChatTitle, listed, draft: '', mode: 'assistant', messages: [] };
}

function replyTo(question: string, mode: AssistantMode): { text: string; emphasis?: string } {
  if (mode === 'solution') {
    return { text: 'Начните с раздела «AI Hub». Опишите задачу и уточните, какие входные данные у вас есть. Так будет проще выбрать подходящее решение.', emphasis: 'AI Hub' };
  }
  if (/отч[её]т|дашборд|показател|метрик/iu.test(question)) {
    const section = /показател|метрик/iu.test(question) ? 'Метрики и показатели' : 'Отчёты';
    return { text: `Проверьте раздел «${section}». Уточните название или домен, чтобы сузить поиск в каталоге.`, emphasis: section };
  }
  return { text: 'Уточните, о какой сущности идёт речь и какой результат вы хотите получить. Например, назовите отчёт, источник или термин из каталога.' };
}

export function useAssistantChats() {
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const [state, setState] = useState(() => ({ activeId: 0, chats: [emptyChat(0)] }));
  const current = state.chats.find(chat => chat.id === state.activeId)!;

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(timer => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  function updateChat(id: number, update: (chat: AssistantChat) => AssistantChat) {
    setState(previous => ({
      ...previous,
      chats: previous.chats.map(chat => chat.id === id ? update(chat) : chat),
    }));
  }

  function startChat() {
    const id = nextId.current++;
    setState(previous => ({
      activeId: id,
      chats: [emptyChat(id, true), ...previous.chats.filter(chat => chat.listed || chat.draft)
        .map(chat => chat.listed ? chat : { ...chat, listed: true })],
    }));
  }

  function removeChat(id: number) {
    state.chats.find(chat => chat.id === id)?.messages.forEach(message => {
      if (message.kind !== 'pending') return;
      clearTimeout(timers.current.get(message.id));
      timers.current.delete(message.id);
    });
    const replacement = nextId.current++;
    setState(previous => {
      const remaining = previous.chats.filter(chat => chat.id !== id);
      if (previous.activeId !== id) return { ...previous, chats: remaining };
      const next = remaining.find(chat => chat.listed) ?? remaining[0] ?? emptyChat(replacement);
      return { activeId: next.id, chats: remaining.length ? remaining : [next] };
    });
  }

  function send() {
    const text = current.draft.trim();
    if (!text) return;
    const id = current.id;
    const questionId = nextId.current++;
    const replyId = nextId.current++;
    const reply = replyTo(text, current.mode);
    updateChat(id, chat => ({
      ...chat,
      draft: '',
      listed: true,
      title: chat.title === newChatTitle && !chat.messages.length ? text.replace(/\s+/gu, ' ') : chat.title,
      messages: [...chat.messages, { id: questionId, kind: 'question', text }, { id: replyId, kind: 'pending' }],
    }));
    const timer = setTimeout(() => {
      timers.current.delete(replyId);
      updateChat(id, chat => ({
        ...chat,
        messages: chat.messages.map(message => message.id === replyId ? { id: replyId, kind: 'answer', ...reply } : message),
      }));
    }, simulatedReplyDelay);
    timers.current.set(replyId, timer);
  }

  return {
    current,
    chats: state.chats.filter(chat => chat.listed),
    startChat,
    selectChat: (id: number) => setState(previous => ({ ...previous, activeId: id })),
    renameChat: (id: number, title: string) => updateChat(id, chat => ({ ...chat, title })),
    removeChat,
    send,
    setDraft: (draft: string) => updateChat(current.id, chat => ({ ...chat, draft })),
    setMode: (mode: AssistantMode) => updateChat(current.id, chat => ({ ...chat, mode })),
  };
}
