import { AttributeValue } from '../../../components/AttributeValue/AttributeValue';
import { Accordion } from '../../../components/Accordion/Accordion';
import { EmptyDetail } from '../EmptyDetail';
import type { ReportDetailContent } from '../source';
import { LineageGraph } from './LineageGraph';
import type { ReportDataSource } from './model';
import s from './Sources.module.css';

function SourceAttributes({ source }: { source: ReportDataSource }) {
  const fields = [
    ['Платформа', source.platform], ['База данных', source.database], ['Схема', source.schema],
    ['Окружение', source.environment], ['Статус', source.status], ['Поля', source.fieldCount], ['URN', source.urn],
  ] as const;
  return <div className={s.attributesGroup}>
    <h3>Состав источника</h3>
    <dl className={s.attributes} aria-label={`Сведения об источнике ${source.name}`}>
      {fields.map(([label,value])=><div key={label} data-wide={label==='URN'||undefined}>
        <dt>{label}</dt><dd data-technical={label==='URN'||undefined}><AttributeValue value={value} /></dd>
      </div>)}
    </dl>
  </div>;
}

export function SourcesTab({ reportTitle, content, onOpenSource }: { reportTitle:string; content?:ReportDetailContent; onOpenSource:(id:string)=>void }) {
  const sources=content?.sources??[];
  if (!sources.length && !content?.lineage) {
    return <EmptyDetail viewport title={content?.sources ? 'Источники отчёта не указаны' : 'Сведения об источниках недоступны'} description="Здесь отображаются источники отчёта и схема происхождения данных." />;
  }

  return <div className={s.tab} data-sources-tab>
    <section className={s.empty} aria-label="Альтернативные источники">
      <span className={s.folder}><img src="/images/report-detail/empty.png" alt="" /></span>
      <div><h2>Альтернативные источники не добавлены</h2><p>Для этого отчёта альтернативные способы получения данных не указаны.</p></div>
    </section>
    {content?.lineage ? <LineageGraph key={reportTitle} reportTitle={reportTitle} sources={sources} graph={content.lineage} /> : <EmptyDetail title="Схема происхождения данных недоступна" description="Схема показывает, как источники связаны с отчётом." />}
    <section className={s.listSection} aria-labelledby="report-sources-title">
      <h2 id="report-sources-title">Источники отчёта <span className={s.total}>{sources.length}</span></h2>
      <div className={s.list} data-report-sources>
        {sources.map((source,index)=><Accordion key={source.id} title={source.name} description={`${source.category==='catalog'?'Источник (каталог) · ':''}Состав и доступные данные`} defaultOpen={index===0} bodyInset="flush" action={
          <div className={s.trailing}>
            {source.platform&&<span className={s.platform}>{source.platform}</span>}
            <button type="button" className={s.sourceLink} aria-label={`Карточка источника ${source.name}`} onClick={()=>onOpenSource(source.id)}>Карточка источника</button>
          </div>
        }><SourceAttributes source={source}/></Accordion>)}
        {!sources.length&&<EmptyDetail title="Источники отчёта не указаны" description="Здесь отображаются сведения об источниках, связанных с отчётом." />}
      </div>
    </section>
  </div>;
}
