import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Ellipsis, ExternalLink, Heart } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { DescriptionText } from '../../components/DescriptionText/DescriptionText';
import { OverflowText } from '../../components/OverflowText/OverflowText';
import { RoundIconButton } from '../../components/RoundIconButton/RoundIconButton';
import type { AiAction, AiSolution } from '../../data/aiHub';
import { AiColumnHeading } from './AiColumnHeading';
import type { AiColumn, AiFilterOptions, AiFilters, AiSort } from './aiFilters';
import s from './AiHubCatalog.module.css';

const actions: readonly { id: AiAction; label: string }[] = [
  { id: 'instructions', label: 'Инструкция' },
  { id: 'tool', label: 'Открыть инструмент' },
  { id: 'recording', label: 'Запись ИИ-пятницы' },
];

const columns: readonly { title: string; width?: number | string; filter?: AiColumn; hideTitle?: boolean }[] = [
  { title: 'Решение' }, { title: 'Описание', width: 378 }, { title: 'Домен', width: 190, filter: 'domain' },
  { title: 'Тип', width: 185, filter: 'type' }, { title: 'Статус', width: 188, filter: 'status' }, { title: 'Активность', width: 130 },
  { title: 'Действия', width: 'var(--ai-end-column)', hideTitle: true },
];
const middleColumnsWidth = columns.reduce((sum, column) => sum + (typeof column.width === 'number' ? column.width : 0), 0);

interface SolutionProps {
  item: AiSolution;
  saved: boolean;
  onBookmark: (id: string) => void;
  onUnavailable: (item: AiSolution, label: string) => void;
  onOpen: (item: AiSolution) => void;
}

function SolutionActions({ item, saved, onBookmark, onUnavailable }: Omit<SolutionProps, 'onOpen'>) {
  const entries = actions.flatMap(({ id, label }) => {
    const action = item.actions[id];
    return action ? [{ id, label, url: action.url }] : [];
  });
  return <div className={s.actions} data-ai-actions>
    {entries.length > 0 && <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className={s.menuTrigger} aria-label={`Действия — ${item.title}`}>
        <Ellipsis size={16} aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} collisionPadding={8} className={s.actionMenu}
          aria-label={`Ссылки — ${item.title}`} data-dropdown-surface="true">
          {entries.map(({ id, label, url }) => {
            const content = <>{label}<ExternalLink size={14} aria-hidden="true" /></>;
            return url
              ? <DropdownMenu.Item className={s.actionItem} key={id} asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">{content}</a>
              </DropdownMenu.Item>
              : <DropdownMenu.Item className={s.actionItem} key={id} onSelect={() => onUnavailable(item, label)}>
                {content}
              </DropdownMenu.Item>;
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>}
    <RoundIconButton icon="bookmark" aria-label={`Закладка — ${item.title}`} aria-pressed={saved} onClick={() => onBookmark(item.id)} />
  </div>;
}

function SolutionTag({ text, tone, clip }: { text: string; tone?: string; clip?: boolean }) {
  return clip
    ? <OverflowText className={s.tag} data-tone={tone} fullText={text}>{text}</OverflowText>
    : <span className={s.tag} data-tone={tone}>{text}</span>;
}

function TypeTag({ type, clip }: Pick<AiSolution, 'type'> & { clip?: boolean }) {
  return <SolutionTag text={type} tone={type === 'ИИ-помощник функций' ? 'purple' : 'blue'} clip={clip} />;
}

function StatusTags({ status, flags, clip }: Pick<AiSolution, 'status' | 'flags'> & { clip?: boolean }) {
  const extra = flags.includes('reuse') ? 'Можно переиспользовать' : flags.includes('friday') ? 'ИИ-пятница' : undefined;
  return <>
    <SolutionTag text={status} tone={status === 'Демо' ? undefined : 'green'} clip={clip} />
    {extra && <SolutionTag text={extra} tone={flags.includes('reuse') ? 'green' : undefined} clip={clip} />}
  </>;
}

function SolutionActivity({ views, likes }: Pick<AiSolution, 'views' | 'likes'>) {
  return <div className={s.stats}>
    <span aria-label={`Просмотры: ${views}`}><img src="/images/source-catalog/eye.svg" width="16" height="16" alt="" />{views}</span>
    <span aria-label={`Отметки «Нравится»: ${likes}`}><Heart size={14} aria-hidden="true" />{likes}</span>
  </div>;
}

function isSurfaceClick(surface: HTMLElement, target: EventTarget) {
  return target instanceof Element && surface.contains(target) && !target.closest('button, a');
}

export function SolutionCard(props: SolutionProps) {
  const { item, onOpen } = props;
  return <article className={s.card} data-ai-solution={item.id} onClick={event => {
    if (isSurfaceClick(event.currentTarget, event.target)) onOpen(item);
  }}>
    <div className={s.tags}>
      <TypeTag type={item.type} />
      <StatusTags status={item.status} flags={item.flags} />
    </div>
    <div className={s.cardBody}>
      <div className={s.cardHeading}>
        <h2><button type="button" data-ai-open className={s.titleButton} onClick={() => onOpen(item)}>{item.title}</button></h2>
        <SolutionActivity views={item.views} likes={item.likes} />
      </div>
      <p className={s.domain}><DescriptionText text={`Домен · ${item.domain}`} /></p>
      <OverflowText as="p" className={s.description} fullText={item.description}>{item.description}</OverflowText>
    </div>
    <footer className={s.cardFooter}><SolutionActions {...props} /></footer>
  </article>;
}

interface TableProps extends Omit<SolutionProps, 'item' | 'saved'> {
  rows: readonly AiSolution[];
  bookmarks: ReadonlySet<string>;
  scrollRef: RefObject<HTMLDivElement | null>;
  scrollPosition: RefObject<{ left: number; top: number }>;
  filters: AiFilters;
  options: AiFilterOptions;
  sort?: AiSort;
  onColumnChange: (column: AiColumn, values: readonly string[], sort?: AiSort) => void;
}

export function AiSolutionsTable({ rows, bookmarks, onBookmark, onUnavailable, onOpen, scrollRef, scrollPosition, filters, options, sort, onColumnChange }: TableProps) {
  const [edges, setEdges] = useState({ start: true, end: true });
  const table = useRef<HTMLTableElement>(null);

  function measureEdges(element: HTMLDivElement) {
    const start = element.scrollLeft <= 1;
    const end = element.scrollWidth - element.clientWidth - element.scrollLeft <= 1;
    setEdges(previous => previous.start === start && previous.end === end ? previous : { start, end });
  }

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo(scrollPosition.current);
    const observer = new ResizeObserver(() => measureEdges(element));
    observer.observe(element);
    if (table.current) observer.observe(table.current);
    measureEdges(element);
    return () => observer.disconnect();
  }, [scrollRef, scrollPosition]);

  return <div className={s.tableFrame} data-list-scroll-boundary data-catalog-view-results
    data-ai-table-start={edges.start} data-ai-table-end={edges.end}>
    <div ref={scrollRef} className={s.tableScroll} data-list-scroll tabIndex={0} role="region"
      aria-label="Прокрутка таблицы AI Hub" onScroll={({ currentTarget }) => {
        scrollPosition.current = { left: currentTarget.scrollLeft, top: currentTarget.scrollTop };
        measureEdges(currentTarget);
      }}>
      <table ref={table} className={s.table} aria-label="Решения AI Hub"
        style={{ minWidth: `calc(var(--ai-start-column) + ${middleColumnsWidth}px + var(--ai-end-column))` }}>
        <colgroup>{columns.map(column => <col key={column.title} style={{ width: column.width }} />)}</colgroup>
        <thead><tr>{columns.map(column => {
          const id = column.filter;
          if (id) return <AiColumnHeading key={id} column={id} options={options[id]} values={filters.fields[id] ?? []} sort={sort}
            onApply={(values, nextSort) => onColumnChange(id, values, nextSort)}
            onClearFilter={() => onColumnChange(id, [], sort)} onClearSort={() => onColumnChange(id, filters.fields[id] ?? [], undefined)} />;
          return <th key={column.title} scope="col" aria-label={column.hideTitle ? column.title : undefined}>
          {column.hideTitle ? null : column.title}
          </th>;
        })}</tr></thead>
        <tbody>{rows.map(item => <tr key={item.id} className={s.tableRow} data-ai-solution={item.id} onClick={event => {
          if (isSurfaceClick(event.currentTarget, event.target)) onOpen(item);
        }}>
          <td><button type="button" className={s.tableTitle} data-ai-open onClick={() => onOpen(item)}>
            <span className={s.solutionIcon} aria-hidden="true" />
            <OverflowText className={s.singleLine} fullText={item.title}>{item.title}</OverflowText>
          </button></td>
          <td><OverflowText className={s.tableDescription} fullText={item.description}>{item.description}</OverflowText></td>
          <td><OverflowText className={s.singleLine} fullText={item.domain}>{item.domain}</OverflowText></td>
          <td><TypeTag type={item.type} clip /></td>
          <td><div className={s.tableStatuses}><StatusTags status={item.status} flags={item.flags} clip /></div></td>
          <td><SolutionActivity views={item.views} likes={item.likes} /></td>
          <td><SolutionActions item={item} saved={bookmarks.has(item.id)} onBookmark={onBookmark} onUnavailable={onUnavailable} /></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
