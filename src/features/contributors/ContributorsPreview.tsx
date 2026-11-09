import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/base.css';
import { ContributorCard } from './ContributorCard';
import { ContributionContentPreview } from './ContributionContentPreview';
import { previewContributors } from './previewFixture';
import styles from './ContributorsPreview.module.css';

function ContributorsPreview() {
  return (
    <main className={styles.preview}>
      <h1>I12 · Проверка карточки участника</h1>
      <p>Технический просмотр. Показатели переданы готовыми строками; действий у карточки нет.</p>
      <section className={styles.example} aria-label="Мастер участника">
        <h2>Мастер · 986 × 163</h2>
        <div className={styles.master} data-preview="master"><ContributorCard contributor={previewContributors[0]} /></div>
      </section>
      <section className={styles.example} aria-label="Экранный экземпляр участника">
        <h2>Экземпляр · 1094 × 162</h2>
        <div className={styles.consumer} data-preview="consumer"><ContributorCard contributor={previewContributors[0]} variant="joined" /></div>
      </section>
      <section className={styles.example} aria-label="Проверка карточек в общей рамке">
        <h2>Техническая композиция · 1096 × 811</h2>
        <p>Группа нужна для сверки плоских карточек. Полный раздел «Вклад в каталог» здесь не реализуется.</p>
        <div className={styles.group} data-preview="group">
          {previewContributors.map(contributor => <ContributorCard key={contributor.id} contributor={contributor} variant="joined" />)}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode>{new URLSearchParams(location.search).has('view') ? <ContributionContentPreview /> : <ContributorsPreview />}</StrictMode>);
