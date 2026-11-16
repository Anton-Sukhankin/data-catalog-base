import { useLayoutEffect, useRef } from 'react';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { CatalogEntityIcon } from '../../components/CatalogEntityIcon/CatalogEntityIcon';
import { ListPagination } from '../../components/ListPagination/ListPagination';
import { OverflowText } from '../../components/OverflowText/OverflowText';
import card from '../../components/ReportCard/ReportCard.module.css';
import groups from '../../components/ReportCard/ReportCardGroups.module.css';
import { paginate } from '../../data/pagination';
import styles from './HomeFavoriteCards.module.css';

export interface HomeFavoriteItem {
  id: string;
  title: string;
  description: string;
}

export interface HomeFavoritePosition {
  id: string;
  scrollTop: number;
}

export function HomeFavoriteCards({ kind, items, pageIndex, pageSize, position, onOpen, onPageChange, onOpenCatalog }: {
  kind: 'source' | 'ai';
  items: readonly HomeFavoriteItem[];
  pageIndex: number;
  pageSize: number;
  position?: HomeFavoritePosition;
  onOpen: (id: string, position: HomeFavoritePosition) => void;
  onPageChange: (pageIndex: number) => void;
  onOpenCatalog: () => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const focusedCard = useRef<HTMLButtonElement>(null);
  const section = useRef<HTMLElement>(null);
  const page = paginate(items, pageIndex, pageSize);
  const isSource = kind === 'source';
  const title = isSource ? 'Избранные источники' : 'Избранные решения AI Hub';

  useLayoutEffect(() => {
    if (scroll.current) scroll.current.scrollTop = position?.scrollTop ?? 0;
    if (position) (focusedCard.current ?? section.current)?.focus({ preventScroll: true });
  }, [page.pageIndex, position]);

  return <section ref={section} tabIndex={-1} className={`${groups.surface} ${styles.surface}`} aria-label={title} data-list-scroll-boundary>
    {page.total === 0
      ? <EmptyState className={styles.empty} title={isSource ? 'В избранном пока нет источников' : 'В избранном пока нет ИИ-решений'}
        description={isSource ? 'Сохраните источник в каталоге, чтобы быстро открыть его отсюда.' : 'Сохраните решение в AI Hub, чтобы быстро открыть его отсюда.'}
        action={{ label: isSource ? 'К источникам' : 'В AI Hub', onClick: onOpenCatalog }} />
      : <>
        <div ref={scroll} className={groups.scroll} data-list-scroll style={{ paddingBottom: page.pageCount > 1 ? 80 : 16 }}>
          <div className={groups.grid} data-flat>
            {page.rows.map(item => <article key={item.id} className={card.card} data-home-favorite-id={item.id}>
              <button ref={position?.id === item.id ? focusedCard : undefined} type="button" className={`${card.open} ${card.openWithoutActions}`}
                onClick={() => onOpen(item.id, { id: item.id, scrollTop: scroll.current?.scrollTop ?? 0 })}>
                <CatalogEntityIcon kind={kind} />
                <span className={card.information}>
                  <OverflowText className={card.title} fullText={item.title}>{item.title}</OverflowText>
                  <span className={card.description}><OverflowText className={card.descriptionValue} fullText={item.description}>{item.description}</OverflowText></span>
                </span>
              </button>
            </article>)}
          </div>
        </div>
        <ListPagination {...page} onPageChange={onPageChange} label={isSource ? 'Страницы избранных источников' : 'Страницы избранных ИИ-решений'} />
      </>}
  </section>;
}
