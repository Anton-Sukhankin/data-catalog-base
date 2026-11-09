import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SubscriptionCard, SubscriptionGroup } from './SubscriptionCard';
import { previewMaster, previewSubscriptions } from './previewFixture';
import { SubscriptionsContentPreview } from './SubscriptionsContentPreview';
import styles from './SubscriptionsPreview.module.css';
import '../../styles/base.css';

type PreviewIntent = { kind: 'unsubscribe' | 'open-report' | 'open-bot'; id: string };

function SubscriptionsPreview() {
  const [intents, setIntents] = useState<PreviewIntent[]>([]);
  const record = (kind: PreviewIntent['kind'], id: string) => setIntents(previous => [...previous, { kind, id }]);
  const callbacks = {
    onUnsubscribe: (id: string) => record('unsubscribe', id),
    onOpenReport: (id: string) => record('open-report', id),
    onOpenBot: (id: string) => record('open-bot', id),
  };
  return (
    <main className={styles.preview}>
      <h1>I10 · Проверка карточки подписки</h1>
      <p>Технический просмотр. Действия записывают намерения и ID в журнал ниже.</p>
      <section className={styles.example} aria-label="Пример группы">
        <h2>Группа · 1096 × 511</h2>
        <div className={styles.group} data-preview="group">
          <SubscriptionGroup subscriptions={previewSubscriptions} {...callbacks} />
        </div>
      </section>
      <section className={styles.example} aria-label="Пример экранного экземпляра">
        <h2>Экземпляр · 1094 × 170</h2>
        <div className={styles.consumer} data-preview="consumer">
          <SubscriptionCard subscription={previewSubscriptions[0]} variant="joined" {...callbacks} />
        </div>
      </section>
      <section className={styles.example} aria-label="Пример мастера">
        <h2>Мастер · 780 × 171</h2>
        <div className={styles.master} data-preview="master">
          <SubscriptionCard subscription={previewMaster} {...callbacks} />
        </div>
      </section>
      <aside className={styles.log} aria-label="Технический журнал намерений">
        <h2>Журнал намерений</h2>
        <p>Этот журнал находится вне продуктового блока. Внешние процессы не выполняются.</p>
        <ol data-intent-log aria-live="polite">
          {intents.map((intent, index) => <li key={index} data-intent-kind={intent.kind} data-intent-id={intent.id}>{intent.kind}: {intent.id}</li>)}
        </ol>
      </aside>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode>{new URLSearchParams(location.search).has('view') ? <SubscriptionsContentPreview /> : <SubscriptionsPreview />}</StrictMode>);
