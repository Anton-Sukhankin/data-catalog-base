import { useContext, useId, useRef, useState } from 'react';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useLocation, useSearchParams } from 'react-router';
import { Accordion } from '../../components/Accordion/Accordion';
import { ControlCount, SegmentedControl } from '../../components/HomeControls/HomeControls';
import { transitionCatalog } from '../../components/catalogTransition';
import { SearchField } from '../../components/Search/SearchField';
import { SearchLandingContext, SearchTargetText } from '../../components/Search/SearchMatch';
import { ListPagination } from '../../components/ListPagination/ListPagination';
import { listPageSize } from '../../data/pagination';
import { catalogSearchPage, normalizeSearch, searchId } from '../../data/catalogSearch';
import { appealStatuses, type AppealFilter, type AppealStatus, type FaqEntry, type QuestionAppeal, type QuestionDraft } from '../../data/questions';
import { AppealList } from './AppealList';
import { AskQuestionDialog } from './AskQuestionDialog';
import { AskQuestionButton } from './AskQuestionButton';
import s from './QuestionsWorkspace.module.css';

const statusFilters: readonly AppealFilter[] = ['all', ...Object.keys(appealStatuses) as AppealStatus[]];

export function QuestionsWorkspace({ faq, appeals, onSubmitQuestion, onClearSearch }: {
  faq: readonly FaqEntry[];
  appeals: readonly QuestionAppeal[];
  onSubmitQuestion: (draft: QuestionDraft) => void;
  onClearSearch: () => void;
}) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [queries, setQueries] = useState({ faq: '', mine: '' });
  const [status, setStatus] = useState<AppealFilter>('all');
  const [askOpen, setAskOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pages, setPages] = useState({ faq: 0, mine: 0 });
  const scroll = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const askTrigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const tab = params.get('questions.tab') === 'mine' ? 'mine' : 'faq';
  const isFaq = tab === 'faq';
  const hasItems = (isFaq ? faq.length : appeals.length) > 0;
  const showStatusFilters = !isFaq && hasItems;
  const query = queries[tab];
  const normalized = normalizeSearch(queries.faq.trim());
  const visibleFaq = normalized ? faq.filter(({ question, answer }) =>
    normalizeSearch(question).includes(normalized) || normalizeSearch(answer).includes(normalized)) : faq;
  const appealSearch = normalizeSearch(queries.mine.trim());
  const matchingAppeals = appealSearch ? appeals.filter(({ subject, message }) =>
    normalizeSearch(subject).includes(appealSearch) || normalizeSearch(message).includes(appealSearch)) : appeals;
  const appealCounts = new Map<AppealStatus, number>();
  for (const appeal of matchingAppeals) {
    appealCounts.set(appeal.status, (appealCounts.get(appeal.status) ?? 0) + 1);
  }
  const visibleAppeals = status === 'all' ? matchingAppeals : matchingAppeals.filter(appeal => appeal.status === status);
  const destination = useContext(SearchLandingContext)?.entry.destination;
  const faqTarget = isFaq && destination?.kind === 'faq' ? destination.id : undefined;
  const appealTarget = !isFaq && destination?.kind === 'appeal' ? destination.id : undefined;
  const faqPage = catalogSearchPage(visibleFaq, faq, pages.faq, listPageSize, faqTarget);
  const appealPage = catalogSearchPage(visibleAppeals, appeals, pages.mine, listPageSize, appealTarget);
  const page = isFaq ? faqPage : appealPage;
  const placeholder = isFaq ? 'Поиск в FAQ' : 'Поиск по темам и сообщениям';
  const options = [
    { id: 'faq', label: 'FAQ', count: faq.length },
    { id: 'mine', label: 'Мои вопросы', count: appeals.length },
  ].map(option => ({ ...option, tabId: `${id}-${option.id}-tab`, panelId: `${id}-${option.id}-panel` }));

  function setQuery(value: string) {
    setQueries(previous => ({ ...previous, [tab]: value }));
    changePage(0);
  }

  function changePage(index: number) {
    if (faqTarget || appealTarget) onClearSearch();
    setPages(previous => ({ ...previous, [tab]: index }));
    scroll.current?.scrollTo(0, 0);
  }

  function clearQuery() {
    input.current?.focus();
    setQuery('');
  }

  function changeTab(next: string) {
    if (next === tab) return;
    scroll.current?.scrollTo(0, 0);
    transitionCatalog(() => setParams(previous => {
      const updated = new URLSearchParams(previous);
      if (next === 'mine') updated.set('questions.tab', next);
      else updated.delete('questions.tab');
      return updated;
    }), 'tab');
  }

  return <section className={s.page} aria-labelledby={`${id}-heading`}>
    <header className={s.heading}>
      <h1 id={`${id}-heading`}>Вопросы и ответы</h1>
      <p>Справочные ответы о каталоге данных и личные обращения к команде.</p>
    </header>
    <div className={s.workspace} data-paginated={page.pageCount > 1}>
      <div ref={scroll} className={s.workspaceScroll} data-list-scroll role="region" aria-label="Прокрутка вопросов и ответов" tabIndex={0}
        onScroll={event => setScrolled(event.currentTarget.scrollTop > 0)}>
        <div className={s.panel} data-scrolled={scrolled}>
          <div className={s.toolbar} data-search={hasItems}>
            <SegmentedControl selection={{ ariaLabel: 'Вопросы и ответы', items: options, selectedId: tab, onChange: changeTab }} />
            {hasItems && <div className={s.search}>
              <SearchField appearance="local" placeholder={placeholder} aria-label={placeholder}
                inputRef={input} value={query} onValueChange={setQuery}
                trailing={query && <button type="button" className={s.clear}
                  aria-label={isFaq ? 'Очистить поиск в FAQ' : 'Очистить поиск по обращениям'} onClick={clearQuery}>
                  <img src="/icons/search/clear.svg" width="16" height="16" alt="" />
                </button>} />
            </div>}
            <AskQuestionButton className={s.action} ref={askTrigger} onClick={() => {
              setSubmitted(false);
              setAskOpen(true);
            }} />
          </div>
          {appeals.length > 0 && <div className={s.statusReveal} data-open={showStatusFilters} inert={!showStatusFilters} aria-hidden={!showStatusFilters}>
            <div className={s.statusClip}>
              <div className={s.statusFilters} role="group" aria-label="Статус обращения">
                {statusFilters.map(filter => <button key={filter} className={s.chip} type="button"
                  aria-pressed={status === filter} onClick={() => { setStatus(filter); changePage(0); }}>
                  <span>{filter === 'all' ? 'Все' : appealStatuses[filter]}</span>
                  <ControlCount count={filter === 'all' ? matchingAppeals.length : appealCounts.get(filter) ?? 0}
                    selected={status === filter} expand />
                </button>)}
              </div>
            </div>
          </div>}
        </div>
        <div className={s.list} id={`${id}-faq-panel`} role="tabpanel" aria-labelledby={`${id}-faq-tab`} hidden={!isFaq} data-detail-tab-content={isFaq || undefined}>
          {faqPage.outside && <p className={s.resultCount} role="status">Найденный вопрос показан вне текущих условий поиска.</p>}
          {faqPage.rows.map(entry => {
            const target = searchId('faq', entry.id);
            const selected = entry.id === faqTarget;
            return <Accordion key={selected ? `${entry.id}:${location.key}` : entry.id} variant="report" defaultOpen={selected}
              title={<SearchTargetText id={target} field="title" text={entry.question} />}>
              <p className={s.answer}><SearchTargetText id={target} field="answer" text={entry.answer} /></p>
            </Accordion>;
          })}
          <span className={s.srOnly} role="status">{faq.length && normalized ? `Найдено в FAQ: ${visibleFaq.length}` : ''}</span>
          {!faqPage.total && (faq.length
            ? <EmptyState title="Ничего не найдено" description="Измените запрос или вернитесь ко всем вопросам FAQ."
              action={{ label: 'Очистить запрос', onClick: clearQuery }} />
            : <EmptyState title="Вопросов пока нет" description="Здесь появятся ответы на частые вопросы о каталоге." />)}
        </div>
        <div className={s.list} id={`${id}-mine-panel`} role="tabpanel" aria-labelledby={`${id}-mine-tab`} hidden={isFaq} data-detail-tab-content={!isFaq || undefined}>
          {!isFaq && <>
            {appealPage.outside && <p className={s.resultCount} role="status">Найденное обращение показано вне текущих условий поиска.</p>}
            <AppealList matches={appealPage.rows} total={appealPage.total} hasAppeals={hasItems}
              filtered={!appealPage.outside && Boolean(appealSearch || status !== 'all')} onReset={() => {
                clearQuery();
                setStatus('all');
              }} />
          </>}
        </div>
      </div>
      <ListPagination {...page} label={isFaq ? 'Страницы FAQ' : 'Страницы обращений'} onPageChange={changePage} />
    </div>
    {askOpen && <AskQuestionDialog onClose={() => {
      setAskOpen(false);
      askTrigger.current?.focus();
    }} onSubmit={draft => {
      onSubmitQuestion(draft);
      setSubmitted(true);
    }} />}
    <div className={submitted ? s.notice : s.srOnly}>
      <p role="status">{submitted ? 'Вопрос добавлен в демонстрационный список' : ''}</p>
      {submitted && <button type="button" aria-label="Закрыть уведомление" onClick={() => {
        setSubmitted(false);
        askTrigger.current?.focus();
      }}>×</button>}
    </div>
  </section>;
}
