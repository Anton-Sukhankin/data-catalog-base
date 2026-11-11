import { AttributeValue } from '../../../components/AttributeValue/AttributeValue';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Bell, CircleHelp, ExternalLink } from 'lucide-react';
import { Tooltip } from 'radix-ui';
import { DescriptionText } from '../../../components/DescriptionText/DescriptionText';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import { Accordion } from '../../../components/Accordion/Accordion';
import { CatalogEntityIcon } from '../../../components/CatalogEntityIcon/CatalogEntityIcon';
import { RoundIconButton } from '../../../components/RoundIconButton/RoundIconButton';
import { SearchTargetText } from '../../../components/Search/SearchMatch';
import { OverflowText } from '../../../components/OverflowText/OverflowText';
import { DetailSecondary } from '../../../components/DetailHeader/DetailSecondary';
import chrome from '../../../components/DetailHeader/DetailHeader.module.css';
import { useDetailScroll } from '../../../components/DetailHeader/useDetailScroll';
import { searchId } from '../../../data/catalogSearch';
import type { SourceSummary } from '../../../data/sources';
import type { SourceDetailData, SourceDetailTab, SourceField } from '../../../data/sourceDetails';
import { SourceLineageGraph } from '../../report-detail/sources/LineageGraph';
import { Link, type LinkProps } from 'react-router';
import { SourceActions, SourceNotice } from '../SourceActions';
import s from './SourceDetail.module.css';

const tabs = [ ['fields','Описание полей'], ['reports','Связанные отчёты'], ['metrics','Метрики'], ['lineage','Lineage'], ['mcp','MCP-инструменты'], ['similar','Похожие источники'] ] as const;
const columnPlural = new Intl.PluralRules('ru');
function columnLabel(count:number) { const form=columnPlural.select(count);return `${count} ${form==='one'?'колонка':form==='few'?'колонки':'колонок'}`; }
function similarSourceLabel(count:number) {
  return `${count} ${columnPlural.select(count) === 'one' ? 'похожий источник' : 'похожих источников'}`;
}
type Tone = 'blue'|'purple'|'red'|'yellow'|'green'|'neutral';
function Tag({text,tone}:{text:string;tone:Tone}) {return <span className={s.tag} data-tone={tone}>{text}</span>;}
function FieldAccordion({field, sourceId}: {field:SourceField; sourceId:string}) {
  const generic = <Tag text={field.genericType} tone="purple"/>;
  const key = <Tag text={field.key?'Key':'Not key'} tone={field.key?'green':'neutral'}/>;
  const metrics = field.relatedMetrics;
  const metricCount = metrics?.length ?? 0;
  return <Accordion defaultOpen={false}
    title={<span className={s.fieldLabel}>
      <OverflowText className={s.fieldName} fullText={field.name}>
        <SearchTargetText id={searchId('field', sourceId, field.name)} field="title" text={field.name}/>
      </OverflowText>
      <span className={s.fieldTags}>
        <OverflowText className={`${s.tag} ${s.sqlType}`} fullText={field.sqlType} data-tone="blue">{field.sqlType}</OverflowText>
        <span className={s.secondaryTag}>{generic}</span>
        <Tag text={field.nullable?'Nullable':'Required'} tone={field.nullable?'yellow':'red'}/>
        <span className={s.secondaryTag}>{key}</span>
      </span>
    </span>}
    inlineMetadata={metricCount > 0 && <span className={s.fieldCount}>Метрики <span className={`${s.counter} ${s.activeCounter}`}>{metricCount}</span></span>}>
    <div className={s.compactFieldTags}>{generic}{key}</div>
    {metrics?.length ? <ul className={s.fieldMetricList} role="list" aria-label="Связанные метрики">
      {metrics.map(metric => <li key={metric}>
        <ExternalLink size={14} aria-hidden="true" />
        <span>{metric}</span>
      </li>)}
    </ul> : <p>{metrics || field.metricCount === 0 ? 'Связанные метрики не найдены' : 'Сведения о связанных метриках не предоставлены'}</p>}
  </Accordion>;
}
function Person({role,name}:{role:string;name?:string}) {return <div className={s.person}>
  <img src="/images/favorites/avatar-placeholder.svg" width="32" height="32" alt=""/>
  <div><small>{role}</small><span><AttributeValue value={name} /></span></div>
</div>;}
export type SourceDetailSummary = Pick<SourceSummary, 'id' | 'technicalName'> &
  Partial<Pick<SourceSummary, 'description' | 'platform' | 'layer' | 'storageContext' | 'objectType' | 'columns' | 'domain' | 'masterSystem' | 'analyst' | 'reports' | 'metrics' | 'mcp' | 'usedInAnalytics' | 'views'>> &
  { technicalStatus?: string; urn?: string };

function SimilarSources({detail}: {detail?: SourceDetailData}) {
  const entries = detail?.similarSources;
  if (!entries?.length) {
    const knownEmpty = entries?.length === 0 || detail?.counts.similar === 0;
    return <EmptyState className={s.empty} data-detail-tab-content
      title={knownEmpty ? 'Похожие источники не найдены' : 'Список похожих источников недоступен'}
      description={knownEmpty ? 'У этого источника нет похожих источников.' : 'Сведения о похожих источниках не предоставлены.'} />;
  }
  return <ul className={s.relatedReports} role="list" aria-label="Похожие источники" data-detail-tab-content>
    {entries.map(({technicalName, businessMetricCount}) => <li key={technicalName} className={s.similarSource}>
      <CatalogEntityIcon kind="source" className={s.similarSourceIcon} />
      <strong className={s.similarSourceName}>{technicalName}</strong>
      <span className={s.similarSourceMetrics}>
        <span>Бизнес-метрики</span>{' '}<span className={s.counter}>{businessMetricCount}</span>
      </span>
    </li>)}
  </ul>;
}

function Passport({source,detail}:{source:SourceDetailSummary;detail?:SourceDetailData}) {return <aside className={s.passport} aria-label="Сведения об источнике">
  <header>
    <h2>Сведения</h2>
    <p>{detail?.synchronizedLabel ? `Синхронизация с DataHub: ${detail.synchronizedLabel}` : 'Домен, мастер-система и ответственные за источник'}</p>
  </header>
  <div className={s.passportBody}>
    <div className={s.attribute}><small>Домен</small><span><AttributeValue value={detail?.domain ?? source.domain} /></span></div>
    <div className={s.attribute}><small>Мастер-система</small><span><AttributeValue value={detail?.masterSystem ?? source.masterSystem} /></span></div>
    <Person role="Ответственный аналитик" name={detail?.analyst ?? source.analyst}/><Person role="Технический владелец" name={detail?.technicalOwner}/>
  </div>
</aside>;}

export type SourceRelatedNavigation = {
  link: (kind: 'report' | 'metric', id: string) => Pick<LinkProps, 'to' | 'state'>;
  saveScroll: (top: number) => void;
  scrollTop?: number;
};

export function SourceDetail({source,detail,tab,onTabChange,onBack,breadcrumbs,backLabel='Источники',relatedNavigation}:{source:SourceDetailSummary;detail?:SourceDetailData;tab:SourceDetailTab;onTabChange:(tab:SourceDetailTab)=>void;onBack:()=>void;breadcrumbs?:readonly DetailCrumb[];backLabel?:string;relatedNavigation?:SourceRelatedNavigation}) {
  const id=useId();
  const { compact, scroll, onScroll } = useDetailScroll(tab);
  const relatedScrollTop = relatedNavigation?.scrollTop;
  useLayoutEffect(() => {
    if ((tab === 'reports' || tab === 'metrics') && relatedScrollTop !== undefined && scroll.current) {
      scroll.current.scrollTop = relatedScrollTop;
    }
  }, [tab, relatedScrollTop, scroll]);
  const [bookmark,setBookmark]=useState(false);
  const [following,setFollowing]=useState(false);
  const [notice,setNotice]=useState<string>();
  const strip=useRef<HTMLDivElement>(null);
  const buttons=useRef<(HTMLButtonElement|null)[]>([]);
  const showMetrics = tab === 'metrics';
  const relatedItems = showMetrics ? detail?.relatedMetrics : detail?.relatedReports;
  const fieldCount = detail?.fields?.length;
  const counts:Record<string,number|undefined> = {fields:fieldCount,reports:detail?.counts.reports ?? source.reports,metrics:detail?.counts.metrics ?? source.metrics,mcp:detail?.counts.mcp ?? source.mcp,similar:detail?.counts.similar};
  const relatedCount = showMetrics ? counts.metrics : counts.reports;
  const relatedItemsEmpty = relatedItems?.length === 0 || relatedCount === 0;
  const structure = [source.objectType, source.columns === undefined ? undefined : columnLabel(source.columns)].filter(Boolean).join(' · ');
  const platform = [source.platform, source.layer, source.storageContext].filter(Boolean).join(' · ');
  const status = detail?.technicalStatus ?? source.technicalStatus;
  const aboutStatus = detail?.aboutMetadata?.technicalStatus ?? status;
  const similarSourceCount = detail?.aboutMetadata?.similarSourceCount ?? detail?.counts.similar;
  const aboutTags: {text:string; tone:Tone}[] = [];
  if (source.objectType) aboutTags.push({ text:source.objectType, tone:'blue' });
  if (aboutStatus) aboutTags.push({ text:aboutStatus, tone:aboutStatus==='Active'||aboutStatus==='Активен'?'green':'neutral' });
  if (source.columns !== undefined) aboutTags.push({ text:columnLabel(source.columns), tone:'neutral' });
  if (source.usedInAnalytics) aboutTags.push({ text:'Используется в аналитике', tone:'green' });
  if (similarSourceCount !== undefined && similarSourceCount > 0) {
    aboutTags.push({ text:similarSourceLabel(similarSourceCount), tone:'blue' });
  }
  function select(value:typeof tabs[number][0]) {
    if(value!=='mcp') {onTabChange(value);setNotice(undefined);}
    else setNotice('Содержимое этой вкладки не предоставлено. Текущий раздел сохранён.');
  }
  function toggleFollowing() {
    setFollowing(!following);
    setNotice(following ? 'Вы больше не следите за источником в прототипе.' : 'Вы следите за источником в прототипе. Уведомления не отправляются.');
  }
  useLayoutEffect(()=>{
    function reveal(){const button=buttons.current[tabs.findIndex(item=>item[0]===tab)], container=strip.current;if(!button||!container)return;const a=button.getBoundingClientRect(),b=container.getBoundingClientRect();if(a.left<b.left)container.scrollLeft+=a.left-b.left;else if(a.right>b.right)container.scrollLeft+=a.right-b.right;}
    reveal();const observer=new ResizeObserver(reveal);if(strip.current)observer.observe(strip.current);return()=>observer.disconnect();
  },[tab]);
  return <article className={`${chrome.frame} ${s.detail}`} data-source-detail-id={source.id} data-detail-compact={compact}>
    <header className={chrome.chrome}>
      <div className={s.hero}>
      <DetailSecondary compact={compact}>
      <div className={s.breadcrumbRow}>
        <DetailBreadcrumbs ancestors={breadcrumbs ?? [{label:backLabel,onSelect:onBack}]} current="Карточка источника" />
      </div>
      </DetailSecondary>
      <div className={s.headingBlock}>
      <div className={s.titleRow}>
        <h1 className={s.title}>{source.technicalName}</h1>
        <div className={s.titleMeta}>
            <Tooltip.Provider delayDuration={350}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className={s.viewsHelp} type="button" aria-label="Что означает счётчик просмотров">
                    <CircleHelp size={16} aria-hidden="true" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className={s.viewsTooltip} sideOffset={6}>Количество просмотров источника</Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
            <span className={s.views} role="group" aria-label="Просмотры источника">
              <img src="/images/source-catalog/eye.svg" width="16" height="16" alt="" />
              <AttributeValue value={source.views} />
            </span>
        </div>
        <div className={s.actions}>
          <RoundIconButton icon="edit" aria-label="Редактировать источник" onClick={()=>setNotice('Редактор источника не подключён. Изменения не выполнены.')}/>
          <RoundIconButton icon="bookmark" aria-label="Закладка источника" aria-pressed={bookmark} onClick={()=>setBookmark(value=>!value)}/>
          <button type="button" className={s.follow} aria-label="Следить за источником" aria-pressed={following} onClick={toggleFollowing}>
            <Bell size={16} aria-hidden="true" />{following ? 'Вы следите' : 'Следить'}
          </button>
          <SourceActions onNotice={setNotice}/>
        </div>
      </div>
      <DetailSecondary compact={compact}>
      <div className={s.meta} data-source-description>{structure&&<span><DescriptionText text={structure} /></span>}{platform&&<span><DescriptionText text={platform} /></span>}{status&&<Tag text={status} tone={status==='Active'||status==='Активен'?'green':'neutral'}/>}</div>
      </DetailSecondary>
      </div>
      </div>
    <div ref={strip} role="tablist" aria-label="Вкладки карточки источника" className={s.tabs}>{tabs.map(([value,label],index)=><button key={value} ref={node=>{buttons.current[index]=node;}} type="button" role="tab" id={`${id}-${value}`} aria-controls={`${id}-content`} aria-selected={tab===value} tabIndex={tab===value?0:-1} onClick={()=>select(value)}
      onKeyDown={event=>{const step=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(step||event.key==='Home'||event.key==='End'){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+step+tabs.length)%tabs.length;select(tabs[next][0]);buttons.current[next]?.focus();buttons.current[next]?.scrollIntoView({block:'nearest',inline:'nearest'});}}}>
      <span>{label}</span>{counts[value]!==undefined&&<span className={s.counter}>{counts[value]}</span>}
    </button>)}</div>
    </header>
    <div ref={scroll} className={chrome.scroll} data-detail-scroll data-list-scroll onScrollCapture={onScroll} tabIndex={0}
      id={`${id}-content`} role="tabpanel" aria-labelledby={`${id}-${tab}`}>
    <div className={`${chrome.scrollContent} ${s.columns}`}>
      {tab==='lineage' ? (
        detail?.lineageReports?.length ? <div className={s.lineageContent} data-detail-tab-content>
          <SourceLineageGraph sourceTitle={source.technicalName} reports={detail.lineageReports} />
        </div> : <EmptyState className={s.empty} data-detail-tab-content title="Граф Lineage недоступен"
          description="Данные о происхождении этого источника не предоставлены." />
      ) : tab==='fields' ? <div className={s.mainColumn}>
        <Accordion title="Об источнике" description="Назначение и содержание источника данных" defaultOpen bodyInset="flush">
          <div className={s.about}>
            {aboutTags.length > 0 && <div className={s.aboutTags}>
              {aboutTags.map(({text,tone}) => <Tag key={text} text={text} tone={tone}/>)}
            </div>}
            <p>{source.urn ? <>URN <span className={s.urn}>{source.urn}</span></>
              : <SearchTargetText id={searchId('source', source.id)} field="description" text={source.description ?? 'Описание отсутствует'}/>}</p>
          </div>
        </Accordion>
        <section className={s.fields} data-detail-tab-content aria-label="Описание полей источника">
          {detail?.fields?.length ? <>
            <h2 className={s.fieldsHeading}>Поля источника</h2>
            {detail.fields.map(field=><FieldAccordion key={field.name} field={field} sourceId={source.id}/>)}
          </>
            : <EmptyState className={s.empty} compact title={detail?.fields ? 'Поля источника не указаны' : 'Сведения о полях недоступны'}
              description={detail?.fields ? 'В этом источнике пока нет описанных полей.' : 'Сведения о полях этого источника не предоставлены.'} />}
        </section>
      </div> : tab==='similar' ? <SimilarSources detail={detail}/> : relatedItems?.length ? (
        <ul className={showMetrics ? `${s.relatedReports} ${s.relatedMetrics}` : s.relatedReports} role="list" aria-label={showMetrics ? 'Метрики источника' : 'Связанные отчёты'} data-detail-tab-content>
          {relatedItems.map(item => {
            const description = item.description ?? ('descriptionUnavailable' in item ? item.descriptionUnavailable : undefined);
            const descriptionId = !showMetrics && description ? `${id}-report-description-${item.id}` : undefined;
            const content = <>
              {showMetrics ? <CatalogEntityIcon kind="metric" /> : <span className={s.relatedReportBadge} aria-hidden="true" />}
              <div className={s.relatedReportText}>
                <h2>{item.title}</h2>
                {description && (showMetrics ? <p>{description}</p> : (
                  <OverflowText as="p" id={descriptionId} className={s.relatedReportDescription} fullText={description}>
                    {description}
                  </OverflowText>
                ))}
              </div>
            </>;
            return <li key={item.id} className={s.relatedReport}>
              {relatedNavigation ? <Link {...relatedNavigation.link(showMetrics ? 'metric' : 'report', item.id)} className={s.relatedReportBody}
                onClick={() => relatedNavigation.saveScroll(scroll.current?.scrollTop ?? 0)}
                aria-label={item.title} aria-describedby={descriptionId}>{content}</Link> : <div className={s.relatedReportBody}>{content}</div>}
            </li>;
          })}
        </ul>
      ) : showMetrics
        ? <EmptyState className={s.empty} data-detail-tab-content
          title={relatedItemsEmpty ? 'Метрики не найдены' : 'Список метрик недоступен'}
          description={relatedItemsEmpty ? 'У этого источника нет связанных метрик.' : 'Сведения о метриках источника не предоставлены.'} />
        : relatedItemsEmpty
          ? <EmptyState className={s.empty} data-detail-tab-content title="Связанные отчёты не найдены" description="У этого источника нет связанных отчётов." />
          : <EmptyState className={s.empty} data-detail-tab-content title="Список связанных отчётов недоступен"
            description={relatedCount !== undefined ? 'Количество связей известно, но список отчётов не предоставлен.' : 'Сведения о связанных отчётах не предоставлены.'} />}
      <Passport source={source} detail={detail}/>
    </div>
    </div>
    {notice&&<SourceNotice message={notice} onClose={()=>setNotice(undefined)}/>}
  </article>;
}
import { DetailBreadcrumbs, type DetailCrumb } from '../../../components/DetailHeader/DetailBreadcrumbs';
