import { Accordion } from '../../../components/Accordion/Accordion';
import type { ReportSummary } from '../../../data/reports';
import { ReportFieldValue } from '../ReportFieldValue';
import type { ReportDetailContent } from '../source';
import s from '../Detail.module.css';
import technical from './Technical.module.css';

type TechnicalValue = string | number | boolean | null | undefined;
type TechnicalField = readonly [label: string, value: TechnicalValue];

function formatTechnicalValue(value: TechnicalValue) {
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';

  const displayValue = typeof value === 'string' ? value.trim() : value;
  return displayValue == null || displayValue === ''
    ? <span className={technical.unknown}>—</span>
    : displayValue;
}

function nonEmptyEntries(values: readonly string[] = []) {
  return values.map(value => value.trim()).filter(Boolean);
}

function TechnicalRow({ fields, layout }: {
  fields: readonly TechnicalField[];
  layout?: 'thirds' | 'left-third' | 'halves' | 'left-wide';
}) {
  return <dl className={technical.row} data-layout={layout}>
    {fields.map(([label, value]) => (
      <ReportFieldValue key={label} label={label} value={formatTechnicalValue(value)} />
    ))}
  </dl>;
}

export function TechnicalTab({ report, detail }: { report: ReportSummary; detail?: ReportDetailContent }) {
  const { catalog = {}, dashboard = {}, workspace = {}, datasets = {} } = detail?.technical ?? {};
  const cardStatus = report.verification && (report.verification.status === 'verified' ? 'Проверена' : 'Не проверена');
  const dashboardTitle = report.platform === 'Visiology' ? 'Дашборд Visiology' : 'Дашборд';
  const tables = nonEmptyEntries(datasets.tables);

  return <div className={`${s.column} ${technical.groups}`} data-report-technical>
    <Accordion title="Карточка каталога" description="Идентификация, проверка и обновление карточки" bodyInset="flush">
      <TechnicalRow layout="thirds" fields={[
        ['Дата создания карточки', catalog.createdAt],
        ['Дата изменения карточки', catalog.updatedAt],
        ['Дата последней синхронизации', catalog.synchronizedAt],
      ]} />
      <TechnicalRow layout="left-third" fields={[
        ['Статус карточки', catalog.verificationStatus?.trim() || cardStatus],
        ['Причина перевода в статус «Требует проверки»', catalog.verificationReason],
      ]} />
      <TechnicalRow layout="left-third" fields={[
        ['Количество изменений дашборда', catalog.dashboardChangeCount],
        ['Способ создания карточки', catalog.creationMethod],
      ]} />
      <TechnicalRow layout="left-third" fields={[
        ['Управляется синхронизацией', catalog.managedBySync],
        ['Источник синхронизации', catalog.syncSource],
      ]} />
      {!detail?.technical && <TechnicalRow layout="thirds" fields={[
        detail?.demonstration ? ['Идентификатор примера', report.id] : ['ID карточки каталога', detail?.catalogId],
        ['Домен', report.domainGroup ?? report.domain],
        ['Расписание обновления', detail?.overview?.refreshSchedule],
      ]} />}
    </Accordion>
    <Accordion title={dashboardTitle} description="Идентификатор, изменение и доступность дашборда" bodyInset="flush">
      <TechnicalRow fields={[[ 'GUID дашборда', dashboard.guid ]]} />
      <TechnicalRow layout="halves" fields={[
        [report.platform === 'Visiology' ? 'Название дашборда в Visiology' : 'Название дашборда', dashboard.name],
        ['Последний редактор дашборда', dashboard.lastEditor],
      ]} />
      <TechnicalRow layout="halves" fields={[
        ['Дата создания отчёта', dashboard.reportCreatedAt],
        ['Дата изменения дашборда', dashboard.updatedAt],
      ]} />
      <TechnicalRow layout="halves" fields={[
        ['Портальный дашборд', dashboard.portal],
        ['Дашборд с публичной ссылкой', dashboard.publicLink],
      ]} />
      {!detail?.technical && <>
        <TechnicalRow layout="halves" fields={[
          ['Название отчёта', report.title],
          ['Платформа', report.platform],
        ]} />
        <TechnicalRow layout="halves" fields={[
          ['Мастер-система', report.masterSystem],
          ['Источники данных', detail?.sources?.length ?? detail?.confirmedCounts?.sources],
        ]} />
      </>}
    </Accordion>
    <Accordion title="Рабочая область" description="Идентификатор и название рабочей области" bodyInset="flush">
      <TechnicalRow layout="left-wide" fields={[
        ['GUID рабочей области', workspace.guid],
        ['Название рабочей области', workspace.name],
      ]} />
    </Accordion>
    <Accordion title="Датасеты и источники" description="Идентификаторы, таблицы и типы источников" bodyInset="flush">
      <TechnicalRow layout="left-wide" fields={[
        ['GUID датасетов', nonEmptyEntries(datasets.datasetGuids).join(', ')],
        ['Названия датасетов', nonEmptyEntries(datasets.datasetNames).join(', ')],
      ]} />
      <TechnicalRow layout="left-wide" fields={[
        ['GUID источников данных', nonEmptyEntries(datasets.sourceGuids).join(', ')],
        ['Типы источников', nonEmptyEntries(datasets.sourceTypes).join(', ')],
      ]} />
      {tables.length ? <dl className={technical.row}>
        <ReportFieldValue label="Таблицы" className={technical.tableField} value={
          <ul className={technical.tableList} role="list">
            {tables.map((table) => <li key={table}>{table}</li>)}
          </ul>
        } />
      </dl> : <TechnicalRow fields={[[ 'Таблицы', undefined ]]} />}
    </Accordion>
  </div>;
}
