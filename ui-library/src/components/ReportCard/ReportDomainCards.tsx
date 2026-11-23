import { CatalogEntityIcon } from '../CatalogEntityIcon/CatalogEntityIcon';
import { OverflowText } from '../OverflowText/OverflowText';
import card from './ReportCard.module.css';
import groups from './ReportCardGroups.module.css';

const plural = new Intl.PluralRules('ru');
const reportNouns: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'отчёт', few: 'отчёта', many: 'отчётов' };

export function ReportDomainCards({ domains, onOpen, viewportOffset = 210 }: {
  domains: readonly { name: string; count: number }[];
  onOpen: (name: string) => void;
  viewportOffset?: number;
}) {
  return <section className={groups.surface} style={{ height: `calc(var(--list-viewport-height, 100vh) - ${viewportOffset}px)` }} aria-label="Домены отчётов" data-list-scroll-boundary>
    <div className={groups.scroll} data-list-scroll>
      <div className={groups.grid} data-flat>
        {domains.map(({ name, count }) => (
          <article key={name} className={card.card}>
            <button type="button" className={`${card.open} ${card.openWithoutActions}`} onClick={() => onOpen(name)}>
              <CatalogEntityIcon kind="domain" />
              <span className={card.information}>
                <OverflowText className={card.title} fullText={name}>{name}</OverflowText>
                <span className={card.description}>{count} {reportNouns[plural.select(count)] ?? 'отчётов'}</span>
              </span>
            </button>
          </article>
        ))}
      </div>
    </div>
  </section>;
}
