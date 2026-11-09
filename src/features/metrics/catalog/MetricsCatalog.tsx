import { AttributeValue } from '../../../components/AttributeValue/AttributeValue';
import { CatalogEntityIcon } from '../../../components/CatalogEntityIcon/CatalogEntityIcon';
import { OverflowText } from '../../../components/OverflowText/OverflowText';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import { useLayoutEffect, useRef, useState } from 'react';
import { MetricActions, MetricDescription, MetricTitle, openMetricFromSurface } from '../../../components/MetricSurface/MetricItem';
import { ViewPicker } from '../../../components/HomeControls/HomeControls';
import { SingleSelect } from '../../../components/SingleSelect/SingleSelect';
import { ResetFiltersButton } from '../../../components/ResetFiltersButton/ResetFiltersButton';
import { metricCatalogPage } from '../../../data/metrics';
import { searchId } from '../../../data/catalogSearch';
import { ListPagination } from '../../../components/ListPagination/ListPagination';
import type { MetricCatalogState, MetricSummary } from '../../../data/metrics';
import styles from './MetricsCatalog.module.css';

export interface MetricsCatalogProps {
  items: readonly MetricSummary[];
  state: MetricCatalogState;
  onStateChange: (patch: Partial<MetricCatalogState>) => void;
  onOpen: (item: MetricSummary) => void;
  initialScrollTop?: number;
  onScroll?: (top: number) => void;
  searchTarget?: string;
  pageIndex: number;
  onPageChange: (index: number) => void;
}

function MetricIdentity({ item, onOpen, table = false }: { item: MetricSummary; onOpen: () => void; table?: boolean }) {
  const key = searchId('metric', item.id);
  return <>
    <CatalogEntityIcon kind={item.type === 'Метрика' ? 'metric' : 'indicator'} />
    <div className={table ? styles.nameText : styles.cardText}>
      <MetricTitle title={item.title} onOpen={onOpen} searchKey={key} />
      <MetricDescription text={item.description} lines={table ? 2 : 1} searchKey={key} />
    </div>
  </>;
}

/** Controlled catalog only. Routing, source data and persisted context belong to the caller. */
export function MetricsCatalog({ items, state, onStateChange, onOpen, initialScrollTop = 0, onScroll, searchTarget, pageIndex, onPageChange }: MetricsCatalogProps) {
  const scroll = useRef<HTMLDivElement>(null);
  const filters = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState<string>();
  const page = metricCatalogPage(items, state, pageIndex, searchTarget);
  const { outside } = page;
  const visible = page.rows;
  useLayoutEffect(() => { if (scroll.current) scroll.current.scrollTop = initialScrollTop; }, [initialScrollTop, state.view, page.pageIndex]);
  const actions = (item: MetricSummary) => <MetricActions title={item.title} onNotice={setNotice} />;

  function resetFilters() {
    filters.current?.querySelector<HTMLButtonElement>('[role="combobox"]')?.focus();
    onStateChange({ type: '', status: '' });
  }

  return <section className={styles.catalog} aria-label="Каталог метрик и показателей" data-metrics-catalog data-view={state.view}>
    {items.length > 0 && <div className={styles.toolbar} data-metrics-toolbar>
      <div className={styles.filters} ref={filters}>
        <div className={styles.select}><SingleSelect label="Тип метрики" className={styles.selectControl} value={state.type} resetValue="" onValueChange={type=>onStateChange({type})}
          options={[{value:'',label:'Все типы'},{value:'Метрика',label:'Метрика'},{value:'Показатель',label:'Показатель'}]}/></div>
        <div className={styles.select}><SingleSelect label="Статус метрики" className={styles.selectControl} value={state.status} resetValue="" onValueChange={status=>onStateChange({status})}
          options={[{value:'',label:'Все статусы'},{value:'Черновик',label:'Черновик'},{value:'Проверена',label:'Проверена'}]}/></div>
        {(state.type || state.status) && <ResetFiltersButton className={styles.resetFilters} onClick={resetFilters} />}
      </div>
      {visible.length > 0 && <ViewPicker selection={{ value: state.view, onChange: view => onStateChange({ view }), ariaLabel: 'Представление метрик' }} />}
    </div>}
    {outside && <p className={styles.searchContext} role="status">Найденный объект показан вне текущих фильтров списка.</p>}
    <div className={`${styles.results} ${state.view === 'cards' ? styles.cardResults : ''}`} data-metrics-results data-catalog-view-results data-list-scroll-boundary>
      <div ref={scroll} className={styles.scroll} data-metrics-scroll data-list-scroll data-paginated={page.pageCount > 1} onScroll={event => onScroll?.(event.currentTarget.scrollTop)}>
        {!items.length ? <EmptyState className={styles.emptyResults} title="Метрик и показателей пока нет" description="Здесь будут отображаться доступные метрики и показатели." />
          : !visible.length ? <EmptyState className={styles.emptyResults} role="status" title="Метрики и показатели не найдены" description="Измените условия или сбросьте фильтры."
            action={{ label: 'Сбросить фильтры', variant: 'filter-reset', onClick: resetFilters }} />
          : state.view === 'cards' ? <div className={styles.cards}>
          {visible.map(item => <article key={item.id} className={styles.card} data-metric-id={item.id} onClick={event => openMetricFromSurface(event, () => onOpen(item))}>
            <div className={styles.cardHeading}>
              <MetricIdentity item={item} onOpen={() => onOpen(item)} />
              {actions(item)}
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.tags}>
                <span className={`${styles.tag} ${styles.typeTag}`}>{item.type}</span>
                <span className={styles.tag}>{item.status}</span>
                <OverflowText className={`${styles.tag} ${styles.domainTag}`} fullText={item.domain}><AttributeValue value={item.domain} /></OverflowText>
                <span className={styles.tag}>Ед. изм.: <AttributeValue value={item.unit} /></span>
              </div>
              <div className={styles.updated}><span>Обновлено</span><span><AttributeValue value={item.updated} /></span></div>
            </div>
          </article>)}
        </div> : <div className={styles.table} role="table" aria-label="Метрики и показатели" aria-colcount={7} aria-rowcount={visible.length + 1}>
          <div className={styles.header} role="rowgroup"><div className={styles.grid} role="row">
            {['Наименование', 'Тип', 'Статус', 'Домен', 'Ед. изм.', 'Обновлено', 'Действия'].map((label, index) => <div role="columnheader" key={label} className={styles.headerCell}>
              {index === 6 ? <span className={styles.srOnly}>{label}</span> : <span>{label}</span>}
            </div>)}
          </div></div>
          <div className={styles.rows} role="rowgroup">
            {visible.map(item => <div role="row" key={item.id} className={`${styles.grid} ${styles.row}`} data-metric-id={item.id} onClick={event => openMetricFromSurface(event, () => onOpen(item))}>
              <div role="cell" className={styles.nameCell}><MetricIdentity item={item} onOpen={() => onOpen(item)} table /></div>
              <div role="cell" className={styles.cell}><span className={`${styles.tag} ${styles.typeTag}`}>{item.type}</span></div>
              <div role="cell" className={styles.cell}><OverflowText className={styles.cellText} fullText={item.status}>{item.status}</OverflowText></div>
              <div role="cell" className={styles.cell}><OverflowText className={styles.cellText} fullText={item.domain}><AttributeValue value={item.domain} /></OverflowText></div>
              <div role="cell" className={styles.cell}><OverflowText className={styles.cellText} fullText={item.unit}><AttributeValue value={item.unit} /></OverflowText></div>
              <div role="cell" className={styles.cell}><span className={styles.cellText}><AttributeValue value={item.updated} /></span></div>
              <div role="cell" className={styles.cell}>{actions(item)}</div>
            </div>)}
          </div>
        </div>}
      </div>
      <ListPagination {...page} label="Страницы метрик и показателей" onPageChange={onPageChange} />
    </div>
    {notice && <div className={styles.notice} role="status"><span>{notice}</span><button type="button" aria-label="Закрыть уведомление метрик" onClick={() => setNotice(undefined)}>×</button></div>}
  </section>;
}
