import { StrictMode, useState } from 'react';
import { SingleSelect } from '../../components/SingleSelect/SingleSelect';
import { createRoot } from 'react-dom/client';
import '../../styles/base.css';
import { NewsList } from './NewsList';
import { NewsCard } from './NewsCard';
import { demoNews, longNews } from './demo';
import styles from './preview.module.css';
import { NewsContentPreview } from './NewsContentPreview';

type PreviewCase = 'all' | 'empty' | 'long';
const initialCase = new URLSearchParams(window.location.search).get('case');

function NewsPreview() {
  const [previewCase, setPreviewCase] = useState<PreviewCase>(initialCase === 'empty' || initialCase === 'long' ? initialCase : 'all');
  const [intents, setIntents] = useState<string[]>([]);
  function recordRead(newsId: string) { setIntents(previous => [...previous, newsId]); }
  return (
    <main className={styles.preview}>
      <aside className={styles.tools} aria-label="Техническая проверка I14">
        <strong>I14 · технический просмотр новостей</strong>
        <label>Пример <SingleSelect label="Пример новостей" value={previewCase} onValueChange={value=>setPreviewCase(value as PreviewCase)} options={[{value:'all',label:'Все · 9 карточек'},{value:'empty',label:'Пустой список'},{value:'long',label:'Длинный текст · отдельный тест'}]}/></label>
        <p>Демонстрационные данные. Действие передаёт ID; чтение статьи здесь не реализуется.</p>
        <output aria-live="polite" data-intent-log>Намерения: {intents.length ? intents.join(', ') : 'нет'}</output>
      </aside>
      {previewCase === 'long' ? (
        <div className={styles.longSurface} data-preview-surface="long"><NewsCard news={longNews} onRead={recordRead} /></div>
      ) : (
        <div className={`${styles.surface} ${previewCase === 'empty' ? styles.emptySurface : ''}`} data-preview-surface={previewCase}>
          <div className={styles.scroll} data-news-scroll><NewsList items={previewCase === 'empty' ? [] : demoNews} onRead={recordRead} /></div>
        </div>
      )}
    </main>
  );
}

const readingPreview = initialCase === 'reading' || initialCase === 'home';
if (readingPreview) document.title = 'I15 — нативное чтение новости';
createRoot(document.getElementById('root')!).render(<StrictMode>{readingPreview ? <NewsContentPreview /> : <NewsPreview />}</StrictMode>);
