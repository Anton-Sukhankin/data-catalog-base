import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronsDownUp, History, Maximize, Minimize, PanelLeft, RotateCcw, SendHorizontal } from 'lucide-react';
import { RoundIconButton } from '../../components/RoundIconButton/RoundIconButton';
import { useModalMorph } from '../../components/useModalMorph';
import { AssistantHistory } from './AssistantHistory';
import { AssistantModePicker } from './AssistantModePicker';
import { useAssistantChats, type AssistantChat, type AssistantMessage } from './assistantChats';
import { useAssistantPanelPlacement } from './useAssistantPanelPlacement';
import s from './AiAssistant.module.css';

function subscribeToViewport(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function readViewportWidth() {
  return window.innerWidth;
}

function readViewportHeight() {
  return window.innerHeight;
}

function AssistantStars({ size = 25 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.8 3.2C11.6 7.7 13.3 9.5 18 10.3c-4.7.8-6.4 2.6-7.2 7.1-.8-4.5-2.6-6.3-7.2-7.1 4.6-.8 6.4-2.6 7.2-7.1Z" />
    <path d="M19.1 15.3c.3 1.8 1 2.6 2.9 2.9-1.9.35-2.6 1.05-2.9 2.9-.3-1.85-1-2.55-2.9-2.9 1.9-.3 2.6-1.1 2.9-2.9Z" />
  </svg>;
}

function EmptyConversation() {
  return <div className={s.empty}>
    <span className={s.emptyIllustration}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5.5 4.5h10A3.5 3.5 0 0 1 19 8v4a3.5 3.5 0 0 1-3.5 3.5H10l-4 3v-3h-.5A3.5 3.5 0 0 1 2 12V8a3.5 3.5 0 0 1 3.5-3.5Z" />
        <path d="M20.5 9.5c.9.5 1.5 1.5 1.5 2.5v4a3 3 0 0 1-3 3h-1v2l-3-2h-3M7 10h.2m3.2 0h.2m3.2 0h.2" />
      </svg>
    </span>
    <h3>Начните чат</h3>
    <p>Напишите первый вопрос о данных каталога.</p>
  </div>;
}

function Message({ message }: { message: AssistantMessage }) {
  if (message.kind === 'question') {
    return <div className={s.question} data-assistant-message="question"><p>{message.text}</p></div>;
  }
  const emphasisIndex = message.kind === 'answer' && message.emphasis ? message.text.indexOf(message.emphasis) : -1;
  return <div className={s.answer} data-assistant-message={message.kind}>
    <strong>AI-ассистент</strong>
    {message.kind === 'pending' ? <p className={s.pending}>
      Готовлю ответ<span className={s.thinkingDots} aria-hidden="true"><i /><i /><i /></span>
    </p> :
      <p>{message.emphasis && emphasisIndex >= 0
        ? <>{message.text.slice(0, emphasisIndex)}<b>{message.emphasis}</b>{message.text.slice(emphasisIndex + message.emphasis.length)}</>
        : message.text}</p>}
  </div>;
}

function DeleteChatDialog({ chat, onCancel, onConfirm }: {
  chat: AssistantChat;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();
  useLayoutEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
    cancel.current?.focus();
  }, []);

  return <dialog ref={dialog} className={s.deleteDialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-hint`}
    onCancel={event => { event.preventDefault(); onCancel(); }}>
    <h2 id={`${id}-title`}>Удалить чат?</h2>
    <p id={`${id}-hint`}>Чат «{chat.title}» и его сообщения будут удалены.</p>
    <footer>
      <button ref={cancel} type="button" onClick={onCancel}>Отмена</button>
      <button className={s.confirmDelete} type="button" onClick={onConfirm}>Удалить</button>
    </footer>
  </dialog>;
}

export function AiAssistant({ suspended = false }: { suspended?: boolean }) {
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed');
  const [expanded, setExpanded] = useState(false);
  const [desktopHistoryOpen, setDesktopHistoryOpen] = useState(true);
  const [narrowHistoryOpen, setNarrowHistoryOpen] = useState(false);
  const [historyWidth, setHistoryWidth] = useState<number>();
  const [panelWidth, setPanelWidth] = useState(730);
  const [deleting, setDeleting] = useState<{ chat: AssistantChat; trigger?: HTMLButtonElement }>();
  const viewportWidth = useSyncExternalStore(subscribeToViewport, readViewportWidth, () => 1440);
  const viewportHeight = useSyncExternalStore(subscribeToViewport, readViewportHeight, () => 900);
  const placement = useAssistantPanelPlacement(viewportWidth, viewportHeight, expanded);
  const narrow = viewportWidth <= 480;
  const model = useAssistantChats();
  const { current } = model;
  const id = useId();
  const launcher = useRef<HTMLButtonElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const previousTranscriptChatId = useRef<number>(null);
  const restoreLauncher = useRef(false);
  const openedByKeyboard = useRef(false);
  const historyOpen = narrow ? narrowHistoryOpen : desktopHistoryOpen;
  const setHistoryOpen = narrow ? setNarrowHistoryOpen : setDesktopHistoryOpen;
  const shown = phase !== 'closed';
  const maxHistory = Math.max(160, Math.min(360, panelWidth - (narrow ? 32 : 260)));
  // Grow the default history column only by the space added to the side panel.
  const addedHistoryWidth = Math.min(40, Math.max(0, viewportWidth - (690 + 2 * 24)));
  const defaultHistoryWidth = Math.min(200 + addedHistoryWidth, maxHistory);
  const actualHistoryWidth = Math.min(historyWidth ?? defaultHistoryWidth, maxHistory);
  const geometryCustomized = expanded || placement.customized || historyWidth !== undefined;

  useModalMorph({
    opener: shown ? launcher.current : null, reveal, panel, closing: phase === 'closing', morphFromOpenerStyle: true,
    onExitComplete: () => {
      restoreLauncher.current = true;
      setPhase('closed');
    },
  });

  useLayoutEffect(() => {
    if (!shown || !panel.current) return;
    const observer = new ResizeObserver(([entry]) => setPanelWidth(entry.contentRect.width));
    observer.observe(panel.current);
    if (openedByKeyboard.current) composer.current?.focus({ preventScroll: true });
    return () => observer.disconnect();
  }, [shown]);

  useLayoutEffect(() => {
    if (!shown && restoreLauncher.current) {
      restoreLauncher.current = false;
      launcher.current?.focus({ preventScroll: true });
    }
  }, [shown]);

  useLayoutEffect(() => {
    const log = transcript.current;
    const sameChat = previousTranscriptChatId.current === current.id;
    previousTranscriptChatId.current = log ? current.id : null;
    if (!log) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    log.scrollTo({ top: log.scrollHeight, behavior: sameChat && !reducedMotion ? 'smooth' : 'instant' });
  }, [current.id, current.messages, shown]);

  function finishConversationSelection() {
    if (narrow) setHistoryOpen(false);
    composer.current?.focus({ preventScroll: true });
  }

  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    model.send();
  }

  function closeDeleteDialog(confirm: boolean) {
    if (confirm && deleting) model.removeChat(deleting.chat.id);
    setDeleting(undefined);
    requestAnimationFrame(() => (confirm ? composer.current : deleting?.trigger)?.focus({ preventScroll: true }));
  }

  function resizeHistory(width: number) {
    setHistoryWidth(previous => {
      if (width === Math.min(previous ?? defaultHistoryWidth, maxHistory)) return previous;
      return width === defaultHistoryWidth ? undefined : width;
    });
  }

  function resetGeometry() {
    setExpanded(false);
    setHistoryWidth(undefined);
    placement.resetBounds();
  }

  const resizeLabel = expanded ? 'Свернуть панель' : 'Развернуть панель';
  const ResizeIcon = expanded ? Minimize : Maximize;
  const heightLabel = geometryCustomized ? 'Вернуть исходный размер и положение панели' : 'Уменьшить высоту панели вдвое';
  const HeightIcon = geometryCustomized ? RotateCcw : ChevronsDownUp;
  return createPortal(<>
    <button ref={launcher} type="button" className={s.launcher} aria-label="Открыть AI-ассистента"
      aria-hidden={shown || suspended || undefined} tabIndex={shown || suspended ? -1 : undefined}
      data-hidden={shown || suspended} onClick={event => {
        openedByKeyboard.current = event.detail === 0;
        resetGeometry();
        setPhase('open');
      }}>
      <AssistantStars />
    </button>
    {shown && <div ref={reveal} className={s.reveal} data-ai-assistant-morph data-catalog-persistent-overlay
      inert={phase === 'closing' || suspended}>
      <section ref={panel} className={s.panel} aria-label="AI-ассистент" data-assistant-expanded={expanded}
        data-gesture={placement.gesture} style={placement.style}>
        <header className={s.header} tabIndex={expanded ? undefined : 0} role={expanded ? undefined : 'group'}
          aria-label={expanded ? undefined : 'Переместить панель стрелками'}
          onPointerDown={event => placement.startGesture(event, 'move')} onKeyDown={placement.moveKey}
          {...placement.pointerHandlers}>
          <div className={s.headerStart}>
            <button className={s.historyToggle} type="button" aria-label={historyOpen ? 'Свернуть список чатов' : 'Развернуть список чатов'}
              aria-controls={`${id}-history`} aria-expanded={historyOpen}
              onClick={() => setHistoryOpen(previous => !previous)}>
              <span className={s.historyStars}><AssistantStars size={19} /></span>
              <span className={s.historyPanelIcon}><PanelLeft size={16} aria-hidden="true" /></span>
            </button>
            <div className={s.heading}><h2>AI-ассистент</h2><p>Вопросы о структуре AI&amp;Data Hub</p></div>
          </div>
          <div className={s.headerActions}>
            <button className={s.historyIndicator} type="button" aria-label="История" disabled>
              <History size={16} aria-hidden="true" />
            </button>
            <button className={s.compact} type="button" aria-label={heightLabel} title={heightLabel}
              disabled={!geometryCustomized && placement.bounds.height <= placement.minHeight}
              onClick={geometryCustomized ? resetGeometry : placement.halveHeight}>
              <HeightIcon size={16} aria-hidden="true" />
            </button>
            <button type="button" className={s.expand} aria-label={resizeLabel} onClick={() => setExpanded(previous => !previous)}>
              <ResizeIcon size={16} aria-hidden="true" /><span>{resizeLabel}</span>
            </button>
            <span className={s.headerDivider} aria-hidden="true" />
            <RoundIconButton icon="close" className={s.close} aria-label="Закрыть AI-ассистента" onClick={() => setPhase('closing')} />
          </div>
        </header>
        <div className={s.workspace}>
          <AssistantHistory id={`${id}-history`} open={historyOpen} chats={model.chats} activeId={current.id}
            width={actualHistoryWidth} maxWidth={maxHistory} deferPointerDismissal={narrow} onWidthChange={resizeHistory}
            onExpand={() => setHistoryOpen(true)}
            onNew={() => { model.startChat(); finishConversationSelection(); }}
            onSelect={model.selectChat} onSelectionComplete={finishConversationSelection} onRename={model.renameChat}
            onDelete={(chat, trigger) => setDeleting({ chat, trigger })} />
          <div className={s.conversation}>
            <div ref={transcript} className={s.transcript} role="log" aria-label="Сообщения чата">
              {current.messages.length === 0 ? <EmptyConversation key={current.id} /> :
                <div key={current.id} className={s.messages}>{current.messages.map(message => <Message key={message.id} message={message} />)}</div>}
            </div>
            <form className={s.composerArea} onSubmit={event => {
              event.preventDefault();
              model.send();
              composer.current?.focus({ preventScroll: true });
            }}>
              <div className={s.composer}>
                <textarea ref={composer} aria-label="Сообщение" value={current.draft} onChange={event => model.setDraft(event.target.value)}
                  onKeyDown={onComposerKey} placeholder="Спросите о данных каталога…" />
                <div className={s.composerFooter}>
                  <AssistantModePicker value={current.mode} onChange={model.setMode} />
                  <button className={s.send} type="submit" aria-label="Отправить сообщение" disabled={!current.draft.trim()}>
                    <SendHorizontal size={19} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        {!expanded && placement.maxHeight > placement.minHeight && (['top', 'bottom'] as const).map(edge =>
          <div key={edge} className={s.verticalResize} data-edge={edge} role="separator" tabIndex={0}
            aria-label={edge === 'top' ? 'Верхняя граница панели ассистента' : 'Нижняя граница панели ассистента'}
            aria-orientation="horizontal" aria-valuemin={placement.minHeight} aria-valuemax={placement.heightLimit(edge)}
            aria-valuenow={placement.bounds.height} aria-valuetext={`${placement.bounds.height} пикселей`}
            onPointerDown={event => placement.startGesture(event, edge)}
            onKeyDown={event => placement.resizeKey(event, edge)} {...placement.pointerHandlers} />,
        )}
      </section>
    </div>}
    {deleting && <DeleteChatDialog chat={deleting.chat} onCancel={() => closeDeleteDialog(false)} onConfirm={() => closeDeleteDialog(true)} />}
  </>, document.body);
}
