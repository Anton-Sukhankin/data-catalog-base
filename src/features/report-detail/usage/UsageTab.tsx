import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Accordion } from '../../../components/Accordion/Accordion';
import { SegmentedControl } from '../../../components/HomeControls/HomeControls';
import { EmptyDetail } from '../EmptyDetail';
import { ReportFieldValue } from '../ReportFieldValue';
import { UsageChart } from './UsageChart';
import { UsageHistoryTable } from './UsageHistoryTable';
import { usageMetrics } from './model';
import type { ReportUsageSource, UsageField, UsageMetric } from './model';
import s from './Usage.module.css';

function Statistics({ title, description, fields, classifications = false }: { title: string; description?: string; fields: readonly UsageField[]; classifications?: boolean }) {
  const emptyCells = (4 - fields.length % 4) % 4;
  return <div className={s.statisticsGroup}>
    <div className={s.period}><h3>{title}</h3>{description && <p>{description}</p>}</div>
    <dl className={s.statistics} aria-label={title} data-summary-classifications={classifications || undefined}>
      {fields.map(field => <ReportFieldValue key={field.label} {...field} />)}
      {Array.from({ length: emptyCells }, (_, index) => <div className={s.emptyStatistic} aria-hidden="true" key={`empty-${index}`} />)}
    </dl>
  </div>;
}

export function UsageTab({ reportId, source }: { reportId: string; source?: ReportUsageSource }) {
  const [metric, setMetric] = useState<UsageMetric>('mau');
  const [dynamicsOpen, setDynamicsOpen] = useState(true);
  const usage = source?.read(reportId);
  if (!usage) return <EmptyDetail viewport title="Статистика использования не предоставлена" description="Здесь отображаются посещаемость, активность пользователей и их динамика по месяцам." />;
  return <div className={s.usage} data-report-usage>
    <Accordion title="Сводная статистика" description="Активность за 30 дней и за жизненный цикл" bodyInset="flush">
      <div className={s.summary}>
        <Statistics title="За последние 30 дней" description="Активность внутри отчёта" fields={usage.current} />
        <Statistics title="За жизненный цикл" description={usage.lifetimePeriod} fields={usage.lifetime} />
        <Statistics title="Статусы и аудитория" fields={usage.classifications} classifications />
      </div>
    </Accordion>
    <Accordion title="Динамика по месяцам" description="Как менялось использование отчёта по месяцам"
      open={dynamicsOpen} onOpenChange={setDynamicsOpen} wrapAction action={dynamicsOpen && (
        <SegmentedControl selection={{ ariaLabel: 'Показатель динамики', items: usageMetrics, selectedId: metric, onChange: id => setMetric(id as UsageMetric) }} />
      )}>
      <UsageChart key={metric} months={usage.history.filter(month => usage.chartMonthIds.includes(month.id))} metric={metric} />
    </Accordion>
    <Accordion title="История по месяцам" description="Показатели активности и их изменения по каждому месяцу" collapsible={false} leadingIcon={<CalendarDays strokeWidth={1.5} />} bodyInset="table">
      <UsageHistoryTable months={usage.history} />
    </Accordion>
  </div>;
}
