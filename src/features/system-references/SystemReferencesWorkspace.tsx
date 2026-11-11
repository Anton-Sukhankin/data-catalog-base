import { AttributeValue } from '../../components/AttributeValue/AttributeValue';
import { useId, useLayoutEffect, useRef, useState, type Ref, type UIEventHandler } from 'react';
import { Table2 } from 'lucide-react';
import { DescriptionSeparator, DescriptionText } from '../../components/DescriptionText/DescriptionText';
import { CatalogEntityIcon } from '../../components/CatalogEntityIcon/CatalogEntityIcon';
import { Link, useSearchParams } from 'react-router';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { SearchPanelToggle } from '../../components/FilterButton/SearchPanelToggle';
import { DetailSecondary } from '../../components/DetailHeader/DetailSecondary';
import chrome from '../../components/DetailHeader/DetailHeader.module.css';
import { ViewPicker } from '../../components/HomeControls/HomeControls';
import { ListPagination } from '../../components/ListPagination/ListPagination';
import { paginate } from '../../data/pagination';
import { OverflowText } from '../../components/OverflowText/OverflowText';
import { RoundIconButton } from '../../components/RoundIconButton/RoundIconButton';
import { SearchTargetText } from '../../components/Search/SearchMatch';
import { searchId } from '../../data/catalogSearch';
import { emptyReferenceFilters, filterReferenceRows, referenceFilterCount, referenceFiltersEqual, type ReferenceOption, type ReferenceRow, type SystemReference, type SystemReferencesGateway } from '../../data/systemReferences';
import { ReferenceSearchPanel } from './ReferenceSearchPanel';
import s from './SystemReferencesWorkspace.module.css';

function systemLabel({ name, code }: SystemReference['system']) {
  return code ? `${name} · ${code}` : name;
}

function ReferenceCatalogCard({ entry, search }: { entry: SystemReference; search: string }) {
  const link = useRef<HTMLAnchorElement>(null);
  const descriptionId = useId();
  const description = systemLabel(entry.system);
  return <li>
    <Link ref={link} className={s.entry} to={{ search }} aria-label={`Открыть справочник — ${entry.title}`} aria-describedby={descriptionId}>
      <CatalogEntityIcon kind="reference" className={s.entryIcon} />
      <span className={s.entryText}>
        <span className={s.entryTitle}>{entry.title}</span>
        <OverflowText id={descriptionId} className={s.systemName} fullText={description} focusTarget={link}><DescriptionText text={description} /></OverflowText>
      </span>
    </Link>
  </li>;
}

function ReferenceCatalogRow({ entry, search }: { entry: SystemReference; search: string }) {
  const link = useRef<HTMLAnchorElement>(null);
  const descriptionId = useId();
  const name = entry.title.replace(/^справочник\s+(\S)/iu, (_, first: string) => first.toLocaleUpperCase('ru'));
  return <tr className={s.catalogRow} onClick={event => {
    if (event.defaultPrevented || (event.target as Element).closest('a') || window.getSelection()?.type === 'Range') return;
    link.current?.click();
  }}>
    <td><Link ref={link} className={s.rowLink} to={{ search }} aria-label={`Открыть справочник — ${entry.title}`} aria-describedby={descriptionId}>
      <CatalogEntityIcon kind="reference" />
      <span className={s.rowTitle}>{name}</span>
    </Link></td>
    <td><OverflowText id={descriptionId} className={s.catalogSystemName} fullText={entry.system.name} focusTarget={link}>{entry.system.name}</OverflowText></td>
    <td><AttributeValue value={entry.system.code} /></td>
  </tr>;
}

function ReferenceCatalog({ entries, params, setParams }: {
  entries: readonly SystemReference[];
  params: URLSearchParams;
  setParams: ReturnType<typeof useSearchParams>[1];
}) {
  const view = params.get('systems.view') === 'list' ? 'list' : 'cards';
  const groupId = useId();
  const scroll = useRef<HTMLDivElement>(null);
  const requestedPage = Number(params.get('systems.page'));
  const { pageCount, pageIndex, pageSize: catalogPageSize, rows: pageEntries } = paginate(entries, requestedPage - 1);

  useLayoutEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 0;
  }, [pageIndex]);

  function changePage(index: number) {
    if (index === pageIndex) return;
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (index === 0) next.delete('systems.page');
      else next.set('systems.page', String(index + 1));
      return next;
    });
  }

  function referenceSearch(id: string) {
    const next = new URLSearchParams(params);
    next.set('systems.reference', id);
    return next.toString();
  }

  return <section className={s.catalog} data-paginated={pageCount > 1} aria-label="Каталог справочников ИС">
    <header className={s.header}>
      <div>
        <h1>Справочники ИС</h1>
        <p className={s.description}>Метаданные информационных систем: сущности, атрибуты, связи и наборы значений.</p>
      </div>
      {entries.length > 0 && <ViewPicker selection={{ value: view, ariaLabel: 'Вид справочников', onChange: value => {
        setParams(previous => {
          const next = new URLSearchParams(previous);
          if (value === 'list') next.set('systems.view', value);
          else next.delete('systems.view');
          return next;
        }, { replace: true });
      } }} />}
    </header>
    {entries.length ? <section className={s.catalogResults} data-view={view} data-catalog-view-results aria-labelledby={groupId}>
      <header className={s.groupHeader}>
        <h2 id={groupId}>Доступные справочники</h2>
        <span className={s.groupCount}>{entries.length}</span>
      </header>
      <div className={s.catalogFrame} data-paginated={pageCount > 1}>
        <div ref={scroll} className={s.catalogScroll} data-list-scroll role="region" aria-label="Прокрутка каталога справочников" tabIndex={0}>
          {view === 'cards' ? <ul className={s.entries} role="list">
            {pageEntries.map(entry => <ReferenceCatalogCard key={entry.id} entry={entry} search={referenceSearch(entry.id)} />)}
          </ul> : <div className={s.catalogTableFrame}>
            <table className={s.catalogTable} aria-labelledby={groupId}>
              <colgroup><col /><col /><col /></colgroup>
              <thead><tr>
                <th scope="col">Справочник</th>
                <th scope="col">Информационная система</th>
                <th scope="col">Код ИС</th>
              </tr></thead>
              <tbody>
                {pageEntries.map(entry => <ReferenceCatalogRow key={entry.id} entry={entry} search={referenceSearch(entry.id)} />)}
              </tbody>
            </table>
          </div>}
        </div>
        <ListPagination total={entries.length} pageIndex={pageIndex} pageSize={catalogPageSize}
          label="Страницы каталога справочников" onPageChange={changePage} />
      </div>
    </section> : <EmptyState title="Справочников пока нет" description="Здесь будут отображаться справочники информационных систем." />}
  </section>;
}

const recordPlural = new Intl.PluralRules('ru');
const optionNouns = { one: 'значение', few: 'значения', many: 'значений', other: 'значений', zero: 'значений', two: 'значения' };

function ReferenceOptions({ options, expanded, onToggle }: {
  options: readonly ReferenceOption[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const listId = useId();
  if (options.length === 0) return <AttributeValue value={null} />;
  const canExpand = options.length > 2;
  const hidden = options.length - 1;
  const list = <ul id={canExpand ? listId : undefined} className={s.optionList} role="list" aria-label="Значения опций">
    {options.map((option, index) => {
      const text = `${option.code} — ${option.label}`;
      const additional = canExpand && index > 0;
      const concealed = additional && !expanded;
      return <li key={option.code} aria-hidden={concealed || undefined} inert={concealed}>
        {additional ? text : <OverflowText className={s.value} fullText={text}>{text}</OverflowText>}
      </li>;
    })}
  </ul>;
  if (!canExpand) return list;
  return <>
    <div className={s.optionReveal} data-open={expanded}>{list}</div>
    <button type="button" className={s.optionsAction} aria-expanded={expanded} aria-controls={listId} onClick={onToggle}>
      {expanded ? 'Свернуть' : `Ещё ${hidden} ${optionNouns[recordPlural.select(hidden)]}`}
    </button>
  </>;
}

function ReferenceTable({ rows, scrollRef, onScroll, paginated, compact, pinHeader, expandedRows, onToggleRow, onTogglePage }: {
  rows: readonly ReferenceRow[];
  scrollRef: Ref<HTMLDivElement>;
  onScroll: UIEventHandler<HTMLDivElement>;
  paginated: boolean;
  compact: boolean;
  pinHeader: boolean;
  expandedRows: ReadonlySet<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: readonly string[]) => void;
}) {
  const expandable = rows.filter(row => row.options.length > 2).map(row => row.id);
  const anyExpanded = expandable.some(id => expandedRows.has(id));
  return <div ref={scrollRef} onScroll={onScroll} className={s.tableSurface} data-list-scroll data-paginated={paginated}
    data-header-pinned={pinHeader} data-header-divider={pinHeader && compact}
    role="region" aria-label="Таблица метаданных CRM" tabIndex={0}>
    <div className={s.tableContent} data-compact={compact}>
    <table className={s.table} aria-label="Метаданные CRM">
      <colgroup><col /><col /><col /><col /></colgroup>
      <thead><tr>
        <th scope="col">Сущность<span>Логическое имя</span></th>
        <th scope="col">Атрибут<span>Логическое имя</span></th>
        <th scope="col">Связи</th>
        <th scope="col" aria-label="Опции">
          <div className={s.optionsHeading}>Опции
            <RoundIconButton icon="chevron" className={s.optionsToggle} disabled={!expandable.length} aria-expanded={anyExpanded}
              aria-label={anyExpanded ? 'Свернуть опции на странице' : 'Раскрыть опции на странице'}
              onClick={() => onTogglePage(expandable)} />
          </div>
        </th>
      </tr></thead>
      <tbody>{rows.map(({ id, entity, attribute, relationships, options }) => <tr key={id} data-options-expanded={expandedRows.has(id)}>
        <td>
          <div className={s.entityCell}>
            <span className={s.entityIcon} aria-hidden="true"><Table2 size={16} strokeWidth={1.5} /></span>
            <div className={s.entityText}>
              <OverflowText as="strong" className={s.value} fullText={entity.name}>{entity.name}</OverflowText>
              <OverflowText className={s.secondary} fullText={entity.logicalName}>{entity.logicalName}</OverflowText>
            </div>
          </div>
        </td>
        <td>
          <OverflowText as="strong" className={s.value} fullText={attribute.name}>{attribute.name}</OverflowText>
          <OverflowText className={s.secondary} fullText={attribute.logicalName}>{attribute.logicalName}</OverflowText>
        </td>
        <td><OverflowText className={s.value} fullText={relationships.join(', ')}><AttributeValue value={relationships.join(', ')} /></OverflowText></td>
        <td><ReferenceOptions options={options} expanded={expandedRows.has(id)} onToggle={() => onToggleRow(id)} /></td>
      </tr>)}</tbody>
    </table>
    </div>
  </div>;
}

function resultLabel(total: number) {
  const form = recordPlural.select(total);
  if (form === 'one') return `Найдена ${total} запись`;
  return `Найдено ${total} ${form === 'few' ? 'записи' : 'записей'}`;
}

function ReferenceDetailHeading({ reference, description, catalogSearch, compact = false }: {
  reference: SystemReference;
  description: string;
  catalogSearch: string;
  compact?: boolean;
}) {
  const target = searchId('system-reference', reference.id);
  const { name, code } = reference.system;
  return <header className={s.detailHeading}>
    <DetailSecondary compact={compact}>
      <div className={chrome.breadcrumbRow}>
        <nav className={chrome.breadcrumbs} aria-label="Хлебные крошки">
          <Link to={{ search: catalogSearch }} replace>Справочники ИС</Link>
          <img src="/images/report-detail/chrome/breadcrumb-chevron.svg" width="16" height="16" alt="" />
          <span aria-current="page">Карточка справочника</span>
        </nav>
      </div>
    </DetailSecondary>
    <div className={s.header}>
      <div>
        <h1><SearchTargetText id={target} field="title" text={reference.title} /></h1>
        <DetailSecondary compact={compact}>
          <div className={s.context}>
            <p className={s.description}>{description}</p>
            <span>Информационная система <span className={s.systemTag}>
              <SearchTargetText id={target} field="system-name" text={name} />
              {code && <><DescriptionSeparator /><SearchTargetText id={target} field="system-code" text={code} /></>}
            </span></span>
          </div>
        </DetailSecondary>
      </div>
      <Link className={s.back} to={{ search: catalogSearch }} replace>К справочникам</Link>
    </div>
  </header>;
}

function ReferenceDetail({ reference, rows, catalogSearch }: {
  reference: SystemReference;
  rows: readonly ReferenceRow[];
  catalogSearch: string;
}) {
  const [draft, setDraft] = useState(emptyReferenceFilters);
  const [applied, setApplied] = useState(emptyReferenceFilters);
  const [expanded, setExpanded] = useState(true);
  const [visible, setVisible] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [withoutPagination, setWithoutPagination] = useState(false);
  const [tableScrolled, setTableScrolled] = useState(false);
  const [expandedRows, setExpandedRows] = useState<ReadonlySet<string>>(() => new Set());
  const searchPanelId = useId();
  const tableScroll = useRef<HTMLDivElement>(null);
  const hasChanges = !referenceFiltersEqual(draft, applied);
  const results = filterReferenceRows(rows, applied);
  const resultPage = paginate(results, pageIndex);
  const paginated = !withoutPagination && resultPage.pageCount > 1;
  const pageRows = withoutPagination ? results : resultPage.rows;

  function resetPagePresentation(index: number) {
    setPageIndex(index);
    setExpandedRows(new Set());
    if (tableScroll.current) tableScroll.current.scrollTop = 0;
    setTableScrolled(false);
  }

  function clearConditions() {
    setDraft(emptyReferenceFilters);
    setApplied(emptyReferenceFilters);
    resetPagePresentation(0);
  }

  function toggleRow(id: string) {
    setExpandedRows(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage(ids: readonly string[]) {
    setExpandedRows(previous => ids.some(id => previous.has(id)) ? new Set() : new Set(ids));
  }

  return <section className={s.detail} aria-label={reference.title}>
    <ReferenceDetailHeading reference={reference} description="Сущности, атрибуты, связи и наборы опций CRM." catalogSearch={catalogSearch} compact={tableScrolled} />
    <div className={`${s.workspace} ${s.crmWorkspace}`}>
      <div className={s.fixedHeader} data-scrolled={tableScrolled} data-search-hidden={!visible}>
        {rows.length > 0 && <>
          <ReferenceSearchPanel id={searchPanelId} visible={visible} expanded={expanded} draft={draft}
            onChange={patch => setDraft(previous => ({ ...previous, ...patch }))}
            onToggle={() => setExpanded(previous => !previous)}
            onReset={clearConditions}
            onApply={() => {
              setApplied(draft);
              resetPagePresentation(0);
            }} />
          <div className={s.resultBar}>
            <p className={s.total} role="status">
              {resultLabel(results.length)} · {hasChanges ? 'до применения изменений' : 'демо'}
            </p>
            {results.length > 0 && <label className={s.paginationMode}>
              <input type="checkbox" checked={withoutPagination} onChange={event => {
                setWithoutPagination(event.target.checked);
                resetPagePresentation(0);
              }} />
              Без пагинации
            </label>}
            <SearchPanelToggle panelId={searchPanelId} visible={visible} conditionCount={referenceFilterCount(draft, applied)}
              onToggle={() => setVisible(previous => !previous)} onClear={clearConditions} />
          </div>
        </>}
      </div>
      <div className={s.tableFrame}>
        {!rows.length ? <EmptyState className={s.emptyResults} title="В справочнике пока нет записей" description="Здесь будут отображаться сведения об объектах информационной системы." />
          : !results.length ? <EmptyState className={s.emptyResults} title="По выбранным условиям ничего не найдено." description="Измените поисковый запрос или сбросьте условия."
            action={{ label: 'Сбросить условия', variant: 'filter-reset', onClick: clearConditions }} />
          : <ReferenceTable rows={pageRows} scrollRef={tableScroll}
            onScroll={event => setTableScrolled(event.currentTarget.scrollTop > 0)} paginated={paginated} compact={tableScrolled} pinHeader={!visible}
            expandedRows={expandedRows} onToggleRow={toggleRow} onTogglePage={togglePage} />}
        {paginated && <ListPagination {...resultPage}
          label="Страницы справочника CRM" onPageChange={index => {
            if (index !== pageIndex) resetPagePresentation(index);
          }} />}
      </div>
    </div>
  </section>;
}

export function SystemReferencesWorkspace({ gateway }: { gateway: SystemReferencesGateway }) {
  const [params, setParams] = useSearchParams();
  const entries = gateway.list();
  const id = params.get('systems.reference');
  if (!id) return <ReferenceCatalog entries={entries} params={params} setParams={setParams} />;

  const reference = entries.find(entry => entry.id === id);
  const catalogParams = new URLSearchParams(params);
  catalogParams.delete('systems.reference');
  const catalogSearch = catalogParams.toString();
  if (reference?.id === 'crm') {
    return <ReferenceDetail key={reference.id} reference={reference} rows={gateway.rows(reference.id)} catalogSearch={catalogSearch} />;
  }
  if (reference) {
    return <section className={s.detail} aria-label={reference.title}>
      <ReferenceDetailHeading reference={reference} description="Сведения об объектах информационной системы." catalogSearch={catalogSearch} />
      <div className={s.workspace}>
        <EmptyState className={s.emptyResults} title="В справочнике пока нет записей" description="Здесь будут отображаться сведения об объектах информационной системы." />
      </div>
    </section>;
  }
  return <section className={s.detail} aria-label="Справочники ИС">
    <header className={s.header}>
      <h1>Справочник не найден</h1>
      <Link className={s.back} to={{ search: catalogSearch }} replace>К справочникам</Link>
    </header>
    <p className={s.description}>Справочник отсутствует в демонстрационном наборе.</p>
  </section>;
}
