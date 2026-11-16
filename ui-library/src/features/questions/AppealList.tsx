import { OverflowText } from '../../components/OverflowText/OverflowText';
import { DescriptionSeparator } from '../../components/DescriptionText/DescriptionText';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { SearchTargetText } from '../../components/Search/SearchMatch';
import { searchId } from '../../data/catalogSearch';
import { appealStatuses, type QuestionAppeal } from '../../data/questions';
import s from './QuestionsWorkspace.module.css';

const plural = new Intl.PluralRules('ru');
const appealNouns: Record<Intl.LDMLPluralRule, string> = {
  zero: 'обращений', one: 'обращение', two: 'обращения', few: 'обращения', many: 'обращений', other: 'обращения',
};
const dateTime = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Moscow',
});

export function AppealList({ matches, total = matches.length, hasAppeals, filtered, onReset }: {
  matches: readonly QuestionAppeal[];
  total?: number;
  hasAppeals: boolean;
  filtered: boolean;
  onReset: () => void;
}) {
  const count = total;
  const announceCount = hasAppeals && filtered;

  return <>
    <p className={announceCount ? s.resultCount : s.srOnly} role="status">
      {announceCount ? `${count} ${appealNouns[plural.select(count)]}` : ''}
    </p>
    {count > 0 ? <ul className={s.appeals} aria-label="Список обращений">
      {matches.map(appeal => <li className={s.appeal} key={appeal.id}>
        <OverflowText as="h2" className={s.subject} fullText={appeal.subject}>
          <SearchTargetText id={searchId('appeal', appeal.id)} field="title" text={appeal.subject} />
        </OverflowText>
        <div className={s.appealMeta}>
          <span className={s.statusTag} data-status={appeal.status}>{appealStatuses[appeal.status]}</span>
          <span>Последнее сообщение<DescriptionSeparator /><time dateTime={appeal.lastMessageAt}>{dateTime.format(new Date(appeal.lastMessageAt))}</time></span>
        </div>
      </li>)}
    </ul> : hasAppeals
      ? <EmptyState title="Обращения не найдены" description="Измените запрос или выберите другой статус."
        action={{ label: 'Сбросить условия', variant: 'filter-reset', onClick: onReset }} />
      : <EmptyState title="У вас пока нет обращений" description="Задайте вопрос команде каталога. Здесь можно будет следить за его статусом." />}
  </>;
}
