import { CatalogEntityIcon } from '../../components/CatalogEntityIcon/CatalogEntityIcon';
import { DescriptionSeparator } from '../../components/DescriptionText/DescriptionText';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import type { MailingTask } from '../../data/tasks';
import s from './TasksWorkspace.module.css';

const dateTime = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Moscow',
});

export function TasksWorkspace({ tasks, onOpenReport }: {
  tasks: readonly MailingTask[];
  onOpenReport: (reportId: string) => void;
}) {
  return <section className={s.page} aria-label="Содержимое раздела">
    <header className={s.heading}>
      <h1>Задачи</h1>
      <p>Заявки на рассылки, которые нужно согласовать и запустить.</p>
    </header>
    {tasks.length > 0 ? <div className={s.workspace} data-list-scroll-boundary>
      <div className={s.scroll} data-list-scroll role="region" aria-label="Прокрутка задач" tabIndex={0}>
        <ul className={s.list} aria-label="Очередь заявок на рассылку">
          {tasks.map(task => <li key={task.id}>
            <button type="button" className={s.card} onClick={() => onOpenReport(task.reportId)}>
              <CatalogEntityIcon kind="task" />
              <span className={s.content}>
                <span className={s.title}>{task.title}</span>
                <span className={s.metadata}>
                  <span>{task.reportTitle}<DescriptionSeparator /></span>
                  <span>Заявка от {task.requestedBy}<DescriptionSeparator /></span>
                  <span><time dateTime={task.requestedAt}>{dateTime.format(new Date(task.requestedAt))}</time><DescriptionSeparator /></span>
                  <span>{task.analyst ? `Аналитик: ${task.analyst}` : 'Аналитик не назначен'}</span>
                </span>
              </span>
            </button>
          </li>)}
        </ul>
      </div>
    </div> : <EmptyState title="Заявок пока нет" description="Здесь появятся заявки на рассылки, которые нужно согласовать и запустить." />}
  </section>;
}
