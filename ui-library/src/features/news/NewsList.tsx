import type { NewsListProps } from './types';
import { NewsCard } from './NewsCard';
import { NewsEmptyState } from './NewsEmptyState';
import styles from './News.module.css';

/** Parent owns the results surface, available width and scrolling. */
export function NewsList({ items, onRead }: NewsListProps) {
  if (items.length === 0) return <NewsEmptyState />;
  return (
    <div className={styles.grid} aria-label="Новости">
      {items.map(news => <NewsCard key={news.id} news={news} onRead={onRead} />)}
    </div>
  );
}
