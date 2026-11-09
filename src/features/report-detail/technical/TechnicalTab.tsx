import type { ReportSummary } from '../../../data/reports';
import type { ReportDetailContent } from '../source';
import s from '../Detail.module.css';

export function TechnicalTab({ report, detail }: { report: ReportSummary; detail?: ReportDetailContent }) {
  const cardStatus = report.verification && (report.verification.status === 'verified' ? 'Проверена' : 'Не проверена');
  const cardId = detail?.demonstration
    ? ['Идентификатор примера', report.id] as const
    : ['ID карточки каталога', detail?.catalogId] as const;
  const sections = [
    {
      title: 'Карточка каталога',
      description: 'Идентификация, проверка и обновление карточки',
      fields: [cardId, ['Домен', report.domainGroup ?? report.domain], ['Статус карточки', cardStatus],
        ['Расписание обновления', detail?.overview.refreshSchedule]],
    },
    {
      title: 'Дашборд',
      description: 'Платформа отчёта и сведения о данных',
      fields: [['Название', report.title], ['Платформа', report.platform], ['Мастер-система', report.masterSystem],
        ['Источники данных', detail?.sources.length]],
    },
  ] as const;

  return <div className={s.column} data-report-technical>
    {sections.map(({ title, description, fields }) => (
      <section className={`${s.info} ${s.technical}`} key={title} aria-label={title}>
        <h2>{title}<small>{description}</small></h2>
        <dl>{fields.map(([label, value]) => <div key={label}>
          <dt>{label}</dt><dd>{value ?? 'Не указано'}</dd>
        </div>)}</dl>
      </section>
    ))}
  </div>;
}
