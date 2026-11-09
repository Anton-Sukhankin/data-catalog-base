import { useState } from 'react';
import { ContributionContent, type ContributionIntent } from './ContributionContent';
import { contributionContentFixture } from './contentFixture';
import styles from './ContributionContentPreview.module.css';
import { DEFAULT_VIEW_MODE } from '../../components/HomeControls/HomeControls';
import { listPageSize } from '../../data/pagination';

export function ContributionContentPreview() {
  const params = new URLSearchParams(location.search);
  const [view, setView] = useState<'cards' | 'list'>(params.get('view') === 'cards' ? 'cards' : DEFAULT_VIEW_MODE);
  const [index, setIndex] = useState(0);
  const [intents, setIntents] = useState<ContributionIntent[]>([]);
  const empty = params.get('case') === 'empty';
  const frozen = params.get('case') === 'frozen';
  const size = params.get('case') === 'paged' || frozen ? 3 : listPageSize;
  const data = empty ? [] : contributionContentFixture;
  const onIntent = (intent: ContributionIntent) => {
    setIntents(previous => [...previous, intent]);
    if (!frozen) setIndex(intent.pageIndex);
  };
  return <main className={styles.preview}>
    <aside className={styles.controller} aria-label="Технический контроллер вклада">
      <h1>I13 · Вклад в каталог</h1>
      <p>5 карточных участников для обоих видов. Недостающие table-атрибуты — «—». Действий у людей нет.</p>
      <button type="button" onClick={() => setView('cards')}>Карточки</button><button type="button" onClick={() => setView('list')}>Таблица</button>
      <nav><a href="?view=cards">Полный набор</a> <a href="?view=cards&case=paged">Две страницы</a> <a href="?view=cards&case=empty">Пусто</a></nav>
      <output data-content-page>{index}</output>
      <ol data-content-intents>{intents.map((intent, i) => <li key={i}>{JSON.stringify(intent)}</li>)}</ol>
    </aside>
    <div className={styles.stage} data-content-stage>
      <ContributionContent view={view} items={data.slice(index * size, (index + 1) * size)} page={{ index, size, total: data.length }} onIntent={onIntent} viewportOffset={empty ? 226 : 210} />
    </div>
  </main>;
}
