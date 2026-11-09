import { useState } from 'react';
import { SubscriptionsContent, type SubscriptionsIntent } from './SubscriptionsContent';
import { subscriptionContentFixture } from './contentFixture';
import styles from './SubscriptionsContentPreview.module.css';
import { DEFAULT_VIEW_MODE } from '../../components/HomeControls/HomeControls';
import { listPageSize } from '../../data/pagination';

export function SubscriptionsContentPreview() {
  const params = new URLSearchParams(location.search);
  const [view, setView] = useState<'cards' | 'list'>(params.get('view') === 'cards' ? 'cards' : DEFAULT_VIEW_MODE);
  const [index, setIndex] = useState(0);
  const [intents, setIntents] = useState<SubscriptionsIntent[]>([]);
  const empty = params.get('case') === 'empty';
  const frozen = params.get('case') === 'frozen';
  const size = params.get('case') === 'paged' || frozen ? 8 : listPageSize;
  const data = empty ? [] : subscriptionContentFixture;
  const onIntent = (intent: SubscriptionsIntent) => {
    setIntents(previous => [...previous, intent]);
    if (intent.kind === 'page-change' && !frozen) setIndex(intent.pageIndex);
  };
  return <main className={styles.preview}>
    <aside className={styles.controller} aria-label="Технический контроллер подписок">
      <h1>I11 · Мои подписки</h1>
      <p>10 исходных подписок. Действия передают намерения; отписка и бот не выполняются.</p>
      <button type="button" onClick={() => setView('cards')}>Карточки</button><button type="button" onClick={() => setView('list')}>Таблица</button>
      <nav><a href="?view=cards">Полный набор</a> <a href="?view=cards&case=paged">Две страницы</a> <a href="?view=cards&case=empty">Пусто</a></nav>
      <output data-content-page>{index}</output>
      <ol data-content-intents>{intents.map((intent, i) => <li key={i}>{JSON.stringify(intent)}</li>)}</ol>
    </aside>
    <div className={styles.stage} data-content-stage>
      <SubscriptionsContent view={view} items={data.slice(index * size, (index + 1) * size)} page={{ index, size, total: data.length }} onIntent={onIntent} />
    </div>
  </main>;
}
