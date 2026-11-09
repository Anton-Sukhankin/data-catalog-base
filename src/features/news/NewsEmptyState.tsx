import styles from './News.module.css';

export function NewsEmptyState() {
  return (
    <section className={styles.empty} aria-label="Новости">
      <img src="/images/news/empty-news.png" width="190" height="142" alt="" />
      <h3 className={styles.emptyTitle}>Новостей пока нет</h3>
      <p className={styles.emptyDescription}>Здесь появятся новости и обновления каталога.<br />Загляните сюда позже.</p>
    </section>
  );
}
