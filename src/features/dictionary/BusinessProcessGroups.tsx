import { Accordion } from '../../components/Accordion/Accordion';
import type { DictionaryProcessCatalog } from '../../data/dictionary';
import s from './Dictionary.module.css';

const plural = new Intl.PluralRules('ru');
const processNouns = { one: 'процесс', few: 'процесса', many: 'процессов', other: 'процесса', zero: 'процессов', two: 'процесса' };

export function BusinessProcessGroups({ catalog }: { catalog: DictionaryProcessCatalog }) {
  return <section className={s.processList} aria-label="Группы бизнес-процессов">
    <p className={s.processSummary}>
      Найдено {catalog.reportedProcessCount} бизнес-процессов в {catalog.reportedGroupCount} группах
    </p>
    {catalog.groups.map(group => <Accordion key={group.id} defaultOpen={false}
      chevronIcon={<span className={s.processChevron} />}
      title={<span className={s.processHeading}>
        <span>{group.name}</span>
        <span className={`${s.tag} ${s.statusTag} ${s.processTag}`}>
          {group.processCount} {processNouns[plural.select(group.processCount)]}
        </span>
      </span>}>
      <p>Список процессов этой группы не предоставлен.</p>
    </Accordion>)}
  </section>;
}
