import { useEffect, useRef, useState } from 'react';

export type AssistantMode = 'assistant' | 'solution';
export type AssistantReply = { text: string; emphasis?: string };
export type AssistantReplySource = (text: string, mode: AssistantMode) => AssistantReply | Promise<AssistantReply>;

export type AssistantMessage =
  | { id: number; kind: 'question'; text: string }
  | { id: number; kind: 'pending' }
  | { id: number; kind: 'answer'; text: string; emphasis?: string };

export interface AssistantChat {
  id: number;
  title: string;
  renamed: boolean;
  listed: boolean;
  draft: string;
  mode: AssistantMode;
  messages: AssistantMessage[];
}

const newChatTitle = 'Новая беседа';

function emptyChat(id: number, listed = false): AssistantChat {
  return { id, title: newChatTitle, renamed: false, listed, draft: '', mode: 'assistant', messages: [] };
}

export function useAssistantChats(requestReply: AssistantReplySource) {
  const nextId = useRef(1);
  const pendingReplies = useRef(new Set<number>());
  const [state, setState] = useState(() => ({ activeId: 0, chats: [emptyChat(0)] }));
  const current = state.chats.find(chat => chat.id === state.activeId)!;

  useEffect(() => {
    const pending = pendingReplies.current;
    return () => pending.clear();
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
      chats: [emptyChat(id, true), ...previous.chats.filter(chat => chat.listed || chat.draft.trim())
        .map(chat => chat.listed ? chat : { ...chat, listed: true })],
    }));
  }

  function removeChat(id: number) {
    state.chats.find(chat => chat.id === id)?.messages.forEach(message => {
      if (message.kind !== 'pending') return;
      pendingReplies.current.delete(message.id);
    });
    const replacement = nextId.current++;
    setState(previous => {
      const remaining = previous.chats.filter(chat => chat.id !== id);
      if (previous.activeId !== id) return { ...previous, chats: remaining };
      const next = remaining.find(chat => chat.listed) ?? remaining[0] ?? emptyChat(replacement);
      return { activeId: next.id, chats: remaining.length ? remaining : [next] };
    });
  }

  async function send() {
    const text = current.draft.trim();
    if (!text) return;
    const id = current.id;
    const questionId = nextId.current++;
    const replyId = nextId.current++;
    updateChat(id, chat => ({
      ...chat,
      draft: '',
      listed: true,
      title: !chat.renamed && !chat.messages.length ? text.replace(/\s+/gu, ' ') : chat.title,
      messages: [...chat.messages, { id: questionId, kind: 'question', text }, { id: replyId, kind: 'pending' }],
    }));
    pendingReplies.current.add(replyId);
    let reply: AssistantReply;
    try {
      reply = await requestReply(text, current.mode);
    } catch {
      reply = { text: 'Не удалось получить ответ. Отправьте вопрос ещё раз.' };
    }
    if (!pendingReplies.current.delete(replyId)) return;
    updateChat(id, chat => ({
      ...chat,
      messages: chat.messages.map(message => message.id === replyId ? { id: replyId, kind: 'answer', ...reply } : message),
    }));
  }

  return {
    current,
    chats: state.chats.filter(chat => chat.listed),
    startChat,
    selectChat: (id: number) => setState(previous => ({ ...previous, activeId: id })),
    renameChat: (id: number, title: string) => updateChat(id, chat =>
      title === chat.title ? chat : { ...chat, title, renamed: true }),
    removeChat,
    send,
    setDraft: (draft: string) => updateChat(current.id, chat => ({ ...chat, draft })),
    setMode: (mode: AssistantMode) => updateChat(current.id, chat => ({ ...chat, mode })),
  };
}
