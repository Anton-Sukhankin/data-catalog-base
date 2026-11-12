import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { DropdownMenu } from 'radix-ui';
import { Ellipsis, MessageSquare, Plus } from 'lucide-react';
import { DropdownItem } from '../../components/DropdownItem/DropdownItem';
import type { AssistantChat } from './assistantChats';
import s from './AiAssistant.module.css';

interface HistoryProps {
  id: string;
  open: boolean;
  chats: AssistantChat[];
  activeId: number;
  width: number;
  maxWidth: number;
  deferPointerDismissal: boolean;
  onWidthChange: (width: number) => void;
  onExpand: () => void;
  onNew: () => void;
  onSelect: (id: number) => void;
  onSelectionComplete: () => void;
  onRename: (id: number, title: string) => void;
  onDelete: (chat: AssistantChat, trigger?: HTMLButtonElement) => void;
}

const minWidth = 160;
const doubleClickWindow = 500;

export function AssistantHistory({
  id, open, chats, activeId, width, maxWidth, deferPointerDismissal,
  onWidthChange, onExpand, onNew, onSelect, onSelectionComplete, onRename, onDelete,
}: HistoryProps) {
  const [renaming, setRenaming] = useState<{ id: number; title: string }>();
  const [resizing, setResizing] = useState(false);
  const drag = useRef<{ x: number; width: number }>(null);
  const preventMenuFocus = useRef(false);
  const actionButtons = useRef(new Map<number, HTMLButtonElement>());
  const selectionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(selectionTimer.current), [open, deferPointerDismissal]);

  function selectChat(event: MouseEvent<HTMLButtonElement>, chat: AssistantChat) {
    clearTimeout(selectionTimer.current);
    if (event.detail > 1) return;
    setRenaming(undefined);
    onSelect(chat.id);
    const touch = event.nativeEvent instanceof window.PointerEvent && event.nativeEvent.pointerType === 'touch';
    // On a narrow panel a mouse double-click needs the row to stay visible.
    if (open && deferPointerDismissal && event.detail > 0 && !touch) {
      selectionTimer.current = setTimeout(onSelectionComplete, doubleClickWindow);
    } else {
      onSelectionComplete();
    }
  }

  function startRename(chat: AssistantChat) {
    clearTimeout(selectionTimer.current);
    if (!open) onExpand();
    setRenaming({ id: chat.id, title: chat.title });
  }

  function finishRename(chatId: number) {
    setRenaming(undefined);
    requestAnimationFrame(() => actionButtons.current.get(chatId)?.focus({ preventScroll: true }));
  }

  function setWidth(value: number) {
    onWidthChange(Math.round(Math.min(maxWidth, Math.max(minWidth, value))));
  }

  function onResizeStart(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, width };
    setResizing(true);
  }

  function onResizeMove(event: PointerEvent<HTMLDivElement>) {
    if (drag.current) setWidth(drag.current.width + event.clientX - drag.current.x);
  }

  function onResizeEnd() {
    drag.current = null;
    setResizing(false);
  }

  function onResizeKey(event: KeyboardEvent<HTMLDivElement>) {
    const next = event.key === 'Home' ? minWidth : event.key === 'End' ? maxWidth :
      event.key === 'ArrowLeft' ? width - 8 : event.key === 'ArrowRight' ? width + 8 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    setWidth(next);
  }

  return <div id={id} className={s.history} data-assistant-history data-collapsed={!open} data-resizing={resizing}
    style={{ width: open ? width : undefined }}>
    <div className={s.historyViewport}>
      <button className={s.newChat} type="button" aria-label="Новая беседа" title={open ? undefined : 'Новая беседа'} onClick={() => {
        clearTimeout(selectionTimer.current);
        setRenaming(undefined);
        onNew();
      }}>
        <Plus size={16} aria-hidden="true" /><span>Новая беседа</span>
      </button>
      <h3 className={s.historyTitle} aria-hidden={!open}><span>Чаты</span></h3>
      {chats.length === 0 ? <p className={s.noChats}>Пока нет чатов</p> :
        <ul className={s.chatList}>
          {chats.map(chat => <li key={chat.id}>
            {open && renaming?.id === chat.id ? (
              <form className={s.renameForm} onSubmit={event => {
                event.preventDefault();
                const title = renaming.title.trim();
                if (title) { onRename(chat.id, title); finishRename(chat.id); }
              }} onKeyDown={event => { if (event.key === 'Escape') finishRename(chat.id); }}>
                <input aria-label="Название чата" value={renaming.title} autoFocus
                  onFocus={event => event.currentTarget.select()}
                  onChange={event => setRenaming({ id: chat.id, title: event.target.value })} />
                <div className={s.renameActions}>
                  <button type="button" onClick={() => finishRename(chat.id)}>Отмена</button>
                  <button type="submit" disabled={!renaming.title.trim()}>Сохранить</button>
                </div>
              </form>
            ) : (
              <div className={s.chatRow} data-current={chat.id === activeId} onDoubleClick={event => {
                const target = event.target;
                if (target instanceof Element && event.currentTarget.contains(target)
                  && !actionButtons.current.get(chat.id)?.contains(target)) startRename(chat);
              }}>
                <button className={s.chatTitle} type="button" aria-current={chat.id === activeId ? 'true' : undefined}
                  aria-label={chat.title} title={chat.title} onClick={event => selectChat(event, chat)}>
                  <MessageSquare size={15} aria-hidden="true" /><span>{chat.title}</span>
                </button>
                {open && <DropdownMenu.Root modal={false} onOpenChange={menuOpen => {
                  if (menuOpen) clearTimeout(selectionTimer.current);
                }}>
                  <DropdownMenu.Trigger ref={element => {
                    if (element) actionButtons.current.set(chat.id, element);
                    else actionButtons.current.delete(chat.id);
                  }} className={s.chatActions} aria-label={`Действия чата «${chat.title}»`}>
                    <Ellipsis size={16} aria-hidden="true" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className={s.chatMenu} data-dropdown-surface="true" sideOffset={4} align="end" collisionPadding={12}
                      onCloseAutoFocus={event => {
                        if (preventMenuFocus.current) event.preventDefault();
                        preventMenuFocus.current = false;
                      }}>
                      <DropdownMenu.Item asChild onSelect={() => {
                        preventMenuFocus.current = true;
                        startRename(chat);
                      }}><DropdownItem>Переименовать</DropdownItem></DropdownMenu.Item>
                      <DropdownMenu.Item asChild onSelect={() => {
                        preventMenuFocus.current = true;
                        onDelete(chat, actionButtons.current.get(chat.id));
                      }}><DropdownItem className={s.deleteItem}>Удалить</DropdownItem></DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>}
              </div>
            )}
          </li>)}
        </ul>}
    </div>
    {open && <div role="separator" tabIndex={0} aria-orientation="vertical" aria-label="Ширина списка чатов"
      aria-controls={id} aria-valuemin={minWidth} aria-valuemax={maxWidth} aria-valuenow={width}
      className={s.resizeHandle} data-resizing={resizing} onPointerDown={onResizeStart} onPointerMove={onResizeMove}
      onPointerUp={onResizeEnd} onLostPointerCapture={onResizeEnd} onKeyDown={onResizeKey} />}
  </div>;
}
