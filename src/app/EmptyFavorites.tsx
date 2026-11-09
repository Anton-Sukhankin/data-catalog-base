import styles from './EmptyFavorites.module.css';

/** Source611:11332/11381: absence of favorites, distinct from a filtered-out set. */
export function EmptyFavorites() {
  return <section className={styles.surface} aria-label="Пустое избранное">
    <div className={styles.empty}>
      <img src="/images/favorites/empty.png" width="190" height="142" alt="" />
      <h2>В избранном пока нет отчётов</h2>
      <p>Добавляйте нужные отчёты в избранное, чтобы быстро<br />возвращаться к ним с главной страницы.</p>
    </div>
  </section>;
}
