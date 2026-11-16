import styles from './News.module.css';

export function NewsEmptyState() {
  return (
    <section className={styles.empty} aria-label="Новости">
      <img src={new URL('../../assets/images/news/empty-news.png', import.meta.url).href} width="190" height="142" alt="" />
      <h3 className={styles.emptyTitle}>Новостей пока нет</h3>
      <p className={styles.emptyDescription}>Здесь появятся новости и обновления каталога.<br />Загляните сюда позже.</p>
    </section>
  );
}
