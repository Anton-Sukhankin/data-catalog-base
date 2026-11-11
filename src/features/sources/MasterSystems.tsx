import { useId, type Ref } from 'react';
import motion from '../../components/Accordion/Accordion.module.css';
import { CatalogEntityIcon } from '../../components/CatalogEntityIcon/CatalogEntityIcon';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ControlCount } from '../../components/HomeControls/HomeControls';
import { SearchField } from '../../components/Search/SearchField';
import { demoMasterSystemGroups, type MasterSystem } from '../../demo/masterSystems';
import s from './MasterSystems.module.css';

const countFormat = new Intl.NumberFormat('ru-RU');

export function MasterSystemSearch({ query, onChange, onClear, inputRef }: {
  query: string;
  onChange: (query: string) => void;
  onClear: () => void;
  inputRef: Ref<HTMLInputElement>;
}) {
  return <div className={s.search}>
    <SearchField appearance="local" aria-label="Поиск по мастер-системам" placeholder="Поиск по мастер-системам…"
      value={query} onValueChange={onChange} inputRef={inputRef} trailing={query && <button type="button" className={s.clear}
        aria-label="Очистить поиск по мастер-системам" onClick={onClear}>
        <img src="/icons/search/clear.svg" width="16" height="16" alt="" />
      </button>} />
  </div>;
}

export function MasterSystems({ query, closed, onToggle, onOpen, onClear }: {
  query: string;
  closed: readonly string[];
  onToggle: (label: string) => void;
  onOpen: (system: MasterSystem) => void;
  onClear: () => void;
}) {
  const id = useId();
  const search = query.trim().toLocaleLowerCase('ru');
  const groups = demoMasterSystemGroups.map(({ label, systems }) => ({
    label,
    systems: systems.filter(system => system.name.toLocaleLowerCase('ru').includes(search)),
  })).filter(group => group.systems.length > 0);

  return <section className={s.surface} aria-label="Мастер-системы" data-master-systems data-catalog-view-results>
    <div className={s.scroll} data-list-scroll role="region" aria-label="Прокрутка мастер-систем" tabIndex={0}>
      {groups.length === 0 ? <EmptyState compact title="Мастер-системы не найдены"
        description="Уточните название или очистите запрос." role="status"
        action={{ label: 'Очистить поиск', onClick: onClear }} /> : groups.map(({ label, systems }, index) => {
        const open = !closed.includes(label);
        const headingId = `${id}-${label}-heading`;
        const panelId = `${id}-${label}-panel`;
        return <section key={label} className={s.group} aria-labelledby={headingId} data-master-group={label}>
          <h2 className={s.heading}>
            <button id={headingId} type="button" className={s.toggle} aria-expanded={open} aria-controls={panelId}
              aria-labelledby={`${headingId}-label ${headingId}-count`}
              aria-describedby={index === 0 ? `${id}-description` : undefined}
              onClick={() => onToggle(label)}>
              <span className={s.identity}>
                <img src="/icons/reports/domain-group.svg" width="16" height="16" alt="" />
                <span id={`${headingId}-label`}>{label}</span>
                <span id={`${headingId}-count`}><ControlCount count={systems.length} selected={!open} expand /></span>
                <span className={motion.groupChevron} data-group-chevron aria-hidden="true" />
              </span>
              {index === 0 && <span id={`${id}-description`} className={s.description}>
                Информационные системы из CMDB с привязанными источниками данных
              </span>}
            </button>
          </h2>
          <div id={panelId} className={s.reveal} data-open={open} aria-hidden={!open} inert={!open}>
            <div className={s.clip}>
              <ul className={s.cards}>
                {systems.map(system => <li key={system.id}>
                  <button type="button" className={s.card} data-master-system={system.id}
                    aria-label={`Открыть источники «${system.name}»`} aria-describedby={`${id}-${system.id}-count`}
                    onClick={() => onOpen(system)}>
                    <CatalogEntityIcon kind="source" />
                    <span className={s.information}>
                      <span className={s.title} data-master-name>{system.name}</span>
                      <span id={`${id}-${system.id}-count`} className={s.count} data-master-count>Источников: {countFormat.format(system.count)}</span>
                    </span>
                  </button>
                </li>)}
              </ul>
            </div>
          </div>
        </section>;
      })}
    </div>
  </section>;
}
