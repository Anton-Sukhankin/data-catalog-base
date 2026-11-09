import { FilterValueList } from '../FilterValueList/FilterValueList';
import { DropdownItem } from '../DropdownItem/DropdownItem';
import { SelectionCheck } from '../DropdownItem/SelectionCheck';
import styles from './ColumnFilterMenu.module.css';
import { ReportRangeField, type ReportRangeFieldProps } from '../ReportRangeField/ReportRangeField';
import { isReportRangeValid } from '../../data/reportFilters';

export interface ColumnFilterOption {
  value: string;
  label: string;
}

export interface ColumnFilterMenuProps {
  label: string;
  /** Caller supplies the already filtered options and keeps all selected values. */
  options: readonly ColumnFilterOption[];
  totalOptionsCount: number;
  selectedValues: readonly string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onToggleValue: (value: string) => void;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (direction: 'asc' | 'desc') => void;
  onReset: () => void;
  onApply: () => void;
  range?: ReportRangeFieldProps;
}

function sortLabels(label: string): readonly [string, string] {
  if (label === 'MAU') return ['По возрастанию', 'По убыванию'];
  if (label === 'Просмотр' || label === 'Последний просмотр') return ['Сначала недавние', 'Сначала давние'];
  return ['А → Я', 'Я → А'];
}

/** Controlled view only. Positioning, closing, draft/apply and data belong to the caller. */
export function ColumnFilterMenu({
  label, options, totalOptionsCount, selectedValues, searchValue, onSearchChange, onToggleValue,
  sortDirection, onSortChange, onReset, onApply, range,
}: ColumnFilterMenuProps) {
  const captions = sortLabels(label);
  return (
    <div key={label} role="dialog" aria-label={`Фильтр: ${label}`} className={styles.menu} data-dropdown-surface="true">
      <div className={styles.sort} data-filter-sort>
        <DropdownItem className={`${styles.sortRow} ${sortDirection === 'asc' ? styles.selectedSort : ''}`}
          aria-pressed={sortDirection === 'asc'} onClick={() => onSortChange('asc')}>
          <img src={`/images/column-filter/sort-asc${sortDirection === 'asc' ? '-selected' : ''}.svg`} alt="" aria-hidden="true" />
          <span>{captions[0]}</span>
          <span className={styles.selection}><SelectionCheck selected={sortDirection === 'asc'}/></span>
        </DropdownItem>
        <DropdownItem className={`${styles.sortRow} ${sortDirection === 'desc' ? styles.selectedSort : ''}`}
          aria-pressed={sortDirection === 'desc'} onClick={() => onSortChange('desc')}>
          <img src="/images/column-filter/sort-desc.svg" alt="" aria-hidden="true" />
          <span>{captions[1]}</span>
          <span className={styles.selection}><SelectionCheck selected={sortDirection === 'desc'}/></span>
        </DropdownItem>
      </div>
      {range ? <div className={styles.rangeBody}><ReportRangeField {...range} /></div> : <FilterValueList label={label} options={options} totalOptionsCount={totalOptionsCount} selectedValues={selectedValues} searchValue={searchValue}
        onSearchChange={onSearchChange} onToggleValue={onToggleValue} embedded />}
      <div className={styles.actions} data-filter-actions>
        <button type="button" className={styles.reset} onClick={onReset}>Сбросить</button>
        <button type="button" className={styles.apply} disabled={range && !isReportRangeValid(range.value)} onClick={onApply}>Применить</button>
      </div>
    </div>
  );
}
