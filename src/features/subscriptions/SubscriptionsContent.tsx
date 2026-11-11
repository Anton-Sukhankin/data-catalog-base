import { useId, useLayoutEffect, useRef, useState } from 'react';
import motion from '../../components/Accordion/Accordion.module.css';
import { ListPagination } from '../../components/ListPagination/ListPagination';
import { SubscriptionGroup, type SubscriptionCardData } from './SubscriptionCard';
import styles from './SubscriptionsContent.module.css';

export interface SubscriptionListItem extends SubscriptionCardData { domain: string }
export interface SubscriptionsPage { index: number; size: number; total: number }
export type SubscriptionsIntent =
  | { kind: 'page-change'; pageIndex: number }
  | { kind: 'unsubscribe' | 'open-bot'; subscriptionId: string }
  | { kind: 'open-report'; report: SubscriptionCardData['report'] };
export interface SubscriptionsContentProps {
  view: 'cards' | 'list';
  /** Current page only; the caller owns data selection, total and page state. */
  items: readonly SubscriptionListItem[];
  page: SubscriptionsPage;
  onIntent: (intent: SubscriptionsIntent) => void;
  viewportOffset?: number;
}
const headings = ['Подписка', 'Статус', 'Отчёт', 'Следующая отправка', 'Контур.Толк', ''];

export function SubscriptionsContent({ view, items, page, onIntent, viewportOffset = 210 }: SubscriptionsContentProps) {
  const scroll = useRef<HTMLDivElement>(null);
  const groupId = useId();
  const [collapsedDomains, setCollapsedDomains] = useState<ReadonlySet<string>>(() => new Set());
  useLayoutEffect(() => { if (scroll.current) scroll.current.scrollTop = 0; }, [page.index, view]);
  const groups = new Map<string, SubscriptionListItem[]>();
  for (const item of items) {
    const group = groups.get(item.domain);
    if (group) group.push(item);
    else groups.set(item.domain, [item]);
  }
  function toggleDomain(domain: string) {
    setCollapsedDomains(previous => {
      const next = new Set(previous);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }
  const hasPages = page.total > page.size;
  const pager = <ListPagination total={page.total} pageIndex={page.index} pageSize={page.size}
    onPageChange={pageIndex => onIntent({ kind: 'page-change', pageIndex })} label="Страницы подписок" />;
  const callbacks = {
    onUnsubscribe: (subscriptionId: string) => onIntent({ kind: 'unsubscribe', subscriptionId }),
    onOpenBot: (subscriptionId: string) => onIntent({ kind: 'open-bot', subscriptionId }),
    onOpenReport: (reportId: string) => {
      const report = items.find(item => item.report.id === reportId)?.report;
      if (report) onIntent({ kind: 'open-report', report });
    },
  };
  return <section className={styles.surface} style={{ height: `calc(100vh - ${viewportOffset}px)` }}
    data-subscriptions-content data-view={view} data-empty={items.length === 0} role={view === 'list' && items.length ? 'table' : undefined} aria-label="Мои подписки">
    {items.length === 0 ? <div className={styles.empty}>
      <img src="/images/subscriptions/empty.png" width="190" height="142" alt="" />
      <h2>Вы пока ни на что не подписаны</h2>
      <p>Откройте нужный отчёт и оформите подписку,<br />чтобы получать его по расписанию.</p>
    </div> : <>
      {view === 'list' && <div role="rowgroup" className={styles.tableHeader}>
        <div role="row" className={styles.grid}>
          {headings.map((label, index) => <div key={index} role="columnheader" aria-label={label || 'Действия'} className={styles.heading}>
            <span>{label}</span>
          </div>)}
        </div>
      </div>}
      <div className={styles.body}>
        <div ref={scroll} className={styles.scroll} tabIndex={0} aria-label="Прокрутка подписок" data-subscriptions-scroll data-list-scroll>
          <div className={styles.groups} style={{ paddingBottom: hasPages ? 80 : 16 }}>
            {Array.from(groups, ([domain, subscriptions]) => {
              const collapsed = collapsedDomains.has(domain);
              const contentId = `${groupId}-${encodeURIComponent(domain)}`;
              const isList = view === 'list';
              return <section key={domain} className={styles.domainGroup} role={isList ? 'rowgroup' : undefined}
                aria-label={isList ? `Подписки: ${domain}` : domain} data-subscription-domain={domain} data-collapsed={collapsed}>
                <div role={isList ? 'row' : undefined}>
                  <div role={isList ? 'cell' : undefined} aria-colspan={isList ? headings.length : undefined}>
                    <button type="button" className={styles.groupHeading} aria-expanded={!collapsed}
                      aria-controls={contentId} onClick={() => toggleDomain(domain)}>
                      <img src="/icons/reports/domain-group.svg" width="16" height="16" alt="" />
                      <span>{domain}</span><span className={styles.count}>{subscriptions.length}</span>
                      <span className={motion.groupChevron} data-group-chevron aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div id={contentId} className={motion.reveal} data-open={!collapsed} inert={collapsed}>
                  <div className={motion.clip}>
                    {view === 'cards' ? <SubscriptionGroup subscriptions={subscriptions} {...callbacks} ariaLabel={`Подписки: ${domain}`} />
                      : <div className={styles.tableGroup}>
                        {subscriptions.map(item => <div role="row" className={`${styles.grid} ${styles.tableRow}`} key={item.id} data-subscription-row-id={item.id}>
                          <div role="cell" className={styles.cell}><span className={styles.document}><img src="/icons/reports/report-document.svg" width="16" height="16" alt="" /></span><span className={styles.subscriptionTitle}>{item.title}</span></div>
                          <div role="cell" className={styles.cell}><span className={styles.status}>{item.statusLabel}</span></div>
                          <div role="cell" className={styles.cell}><button type="button" className={styles.reportLink} onClick={() => onIntent({ kind: 'open-report', report: item.report })}>{item.report.title}</button></div>
                          <div role="cell" className={styles.cell}>{item.nextDeliveryText}</div>
                          <div role="cell" className={styles.cell}><button type="button" className={styles.botLink} aria-label={`${item.botActionLabel}: «${item.title}»`} onClick={() => callbacks.onOpenBot(item.id)}>{item.botActionLabel}</button></div>
                          <div role="cell" className={styles.cell}><button type="button" className={styles.unsubscribe} aria-label={`Отписаться от «${item.title}»`} onClick={() => callbacks.onUnsubscribe(item.id)}>Отписаться</button></div>
                        </div>)}
                      </div>}
                  </div>
                </div>
              </section>;
            })}
          </div>
        </div>
        {view === 'list' && pager}
      </div>
      {view === 'cards' && pager}
    </>}
  </section>;
}
