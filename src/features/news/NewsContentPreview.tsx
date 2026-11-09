import { useState } from 'react';
import { SingleSelect } from '../../components/SingleSelect/SingleSelect';
import { NewsContent, filterNewsByCategory } from './NewsContent';
import { demoNewsArticles } from './articles';
import type { NewsCategoryId } from './types';
import styles from './NewsContentPreview.module.css';

/** Isolated technical controller; the real root owns URL/history and list position. */
export function NewsContentPreview() {
  const params = new URLSearchParams(location.search);
  const initialCategory = params.get('category');
  const [category, setCategory] = useState<NewsCategoryId>(initialCategory === 'new' || initialCategory === 'important' || initialCategory === 'changes' ? initialCategory : 'all');
  const [currentId, setCurrentId] = useState<string | undefined>(params.get('case') === 'reading' ? params.get('news') ?? 'demo-news-1' : undefined);
  const [positions, setPositions] = useState<Partial<Record<NewsCategoryId, number>>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [intents, setIntents] = useState<string[]>([]);
  const [freeze, setFreeze] = useState(params.get('freeze') === '1');
  const items = filterNewsByCategory(demoNewsArticles, category);
  function record(text: string) { setIntents(previous => [...previous, text]); }
  function back() { record('back'); if (!freeze) setCurrentId(undefined); }
  return <main className={styles.preview}>
    <aside className={styles.tools} aria-label="Техническая проверка I15">
      <h1>I15 · чтение новостей</h1>
      <div className={styles.category}>Категория<SingleSelect label="Категория" value={category} resetValue="all" onValueChange={value=>{setCategory(value as NewsCategoryId);setCurrentId(undefined);setPageIndex(0);}} options={[{value:'all',label:'Все'},{value:'new',label:'Новое'},{value:'important',label:'Важное'},{value:'changes',label:'Изменения'}]}/></div>
      <label><input type="checkbox" checked={freeze} onChange={event => setFreeze(event.target.checked)} />Заморозить props</label>
      <p>Первый материал взят из Figma, остальные материалы демонстрационные. URL и история здесь не меняются.</p>
      <output data-content-state>{currentId ?? 'list'}; {category}; scroll {positions[category] ?? 0}</output>
      <ol data-news-intents>{intents.map((intent, index) => <li key={index}>{intent}</li>)}</ol>
    </aside>
    <div className={styles.stage} style={{ top: currentId ? 154 : 210 }} data-news-content-stage>
      <NewsContent category={category} items={items} currentNewsId={currentId} listScrollTop={positions[category] ?? 0}
        pageIndex={pageIndex} onPageChange={index => { setPageIndex(index); setPositions(previous => ({ ...previous, [category]: 0 })); }}
        onListScroll={top => setPositions(previous => ({ ...previous, [category]: top }))}
        onRead={id => { record(`read: ${id}`); if (!freeze) setCurrentId(id); }}
        onBack={back}
        onChangeArticle={id => { record(`change: ${id}`); if (!freeze) setCurrentId(id); }} />
    </div>
  </main>;
}
