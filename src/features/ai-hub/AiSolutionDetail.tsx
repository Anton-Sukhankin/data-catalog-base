import { AttributeValue } from '../../components/AttributeValue/AttributeValue';
import { ExternalLink } from 'lucide-react';
import { OverflowText } from '../../components/OverflowText/OverflowText';
import { RoundIconButton } from '../../components/RoundIconButton/RoundIconButton';
import { SearchTargetText } from '../../components/Search/SearchMatch';
import { searchId } from '../../data/catalogSearch';
import type { AiSolution } from '../../data/aiHub';
import s from './AiSolutionDetail.module.css';

const actions = [
  {id:'tool', label:'Открыть инструмент'},
  {id:'instructions', label:'Инструкции'},
] as const;

function Passport({item}:{item:AiSolution}) {
  const fields = [
    ['Тип',item.type], ['Статус',item.status],
    ['Домен',item.domain], ['Платформа',item.platform],
    ['Создано',item.detail?.created], ['Обновлено',item.detail?.updated],
    ['Для кого',item.detail?.audience,true], ['Что на выходе',item.detail?.output,true],
  ] as const;
  const people = item.detail?.people ?? [];
  return <section className={s.passport} aria-label="Паспорт решения">
    <h3>Паспорт решения</h3>
    <dl className={s.attributes}>{fields.map(([label,value,fullWidth])=><div key={label} className={fullWidth ? s.fullWidthAttribute : undefined}>
      <dt>{label}</dt><dd><AttributeValue value={value} /></dd>
    </div>)}</dl>
    {people.length ? people.map(person=><div className={s.person} key={person.role}>
      <img src={person.avatar ?? '/images/favorites/avatar-placeholder.svg'} width="32" height="32" alt=""/>
      <div className={s.personText}>
        <span>{person.name}</span>
        {person.position && <small>{person.position}</small>}
      </div>
      <span className={s.role}>{person.role}</span>
    </div>) : <p className={s.noPeople}>Сведения об ответственных не предоставлены.</p>}
  </section>;
}

export function AiSolutionDetail({item, items, saved, onBookmark, onSelect, onBack, onNotice}:{
  item:AiSolution; items:readonly AiSolution[]; saved:boolean; onBookmark:()=>void;
  onSelect:(item:AiSolution)=>void; onBack:()=>void; onNotice:(message:string)=>void;
}) {
  const inResults = items.some(solution=>solution.id===item.id);
  const target = searchId('ai-solution', item.id);
  return <div className={s.layout}>
    <article className={s.detail} data-ai-detail={item.id} data-detail-tab-content>
      <header className={s.header}>
        <div className={s.titleRow}>
          <RoundIconButton icon="chevron" className={s.back} aria-label="Вернуться в каталог AI Hub" onClick={onBack} />
          <h2 tabIndex={-1} data-ai-detail-heading><SearchTargetText id={target} field="title" text={item.title} /></h2>
        </div>
        <div className={s.toolbar}>{actions.map(({id,label})=>{
          const action = item.actions[id];
          if (!action) return null;
          const content = <>{label}<ExternalLink size={14} aria-hidden="true"/></>;
          return action.url
            ? <a key={id} className={s.action} href={action.url}>{content}</a>
            : <button key={id} type="button" className={s.action} onClick={()=>onNotice(`Адрес для действия «${label}» не предоставлен.`)}>{content}</button>;
        })}
          {item.detail?.hasEditAction && <RoundIconButton icon="edit" aria-label="Редактировать решение"
            onClick={()=>onNotice('Редактор решения не подключён.')}/>}
          <RoundIconButton icon="bookmark" aria-label={`Закладка — ${item.title}`} aria-pressed={saved} onClick={onBookmark}/>
        </div>
      </header>
      <div key={item.id} className={s.body} data-list-scroll="local" tabIndex={0} role="region" aria-label="Содержимое решения">
        {!inResults && <p className={s.outside} role="status">Выбранное решение не входит в текущую выдачу.</p>}
        <div className={s.columns}>
          <div className={s.overview}>
            <section><h3>Назначение</h3>
              {(item.detail?.purpose ?? [item.description]).map((paragraph,index)=><p key={index}>
                <SearchTargetText id={target} field={`purpose.${index}`} text={paragraph} />
              </p>)}
            </section>
            {!!item.detail?.tasks?.length && <section><h3>Решаемые задачи</h3>
              <ul>{item.detail.tasks.map(task=><li key={task}>{task}</li>)}</ul>
            </section>}
            {item.detail?.example && <section><h3>Пример запроса</h3><p>{item.detail.example}</p></section>}
          </div>
          <Passport item={item}/>
        </div>
      </div>
    </article>
    <aside className={s.sidebar} aria-label="Решения AI Hub">
      <nav className={s.list} aria-label="Решения в текущей выдаче" data-list-scroll="local">
        {items.map(solution=>{
          const summary = solution.detail?.summary ?? solution.description;
          return <button type="button" className={s.mini} key={solution.id} aria-current={solution.id===item.id ? 'page' : undefined}
            onClick={()=>onSelect(solution)}>
            <OverflowText className={s.miniTitle} fullText={solution.title}>{solution.title}</OverflowText>
            <OverflowText fullText={summary}>{summary}</OverflowText>
          </button>;
        })}
        {!items.length && <p className={s.noResults}>По текущим фильтрам решений нет.</p>}
      </nav>
    </aside>
  </div>;
}
