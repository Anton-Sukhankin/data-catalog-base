import { createPortal } from 'react-dom';
import { ReportFilterPanel } from '../components/ReportFilterPanel';
import { FilterValueList } from '../components/FilterValueList';
import { reportFilterLabels } from '../data/reportFilters';
import type { useReportFilterPanel } from './useReportFilterPanel';
import styles from './NavigationPreview.module.css';

export function ReportFilterOverlay({ controller, context }: {
  controller: ReturnType<typeof useReportFilterPanel>;
  context: 'catalog' | 'favorites';
}) {
  if (!controller.isOpen) return null;
  const field = controller.field;
  const container = controller.panelRef.current?.querySelector('[data-report-filter-panel]');
  return createPortal(<>
    <div ref={controller.panelRef}>
      <ReportFilterPanel context={context} opener={controller.opener} fields={controller.fields} rangeFields={controller.rangeFields} activeFieldId={field?.id}
        draftAttributeCount={controller.count} canApply={controller.canApply} showReset={controller.count > 0}
        closing={controller.closing} onExitComplete={controller.finishExit}
        onFieldOpen={controller.openField} onFieldValueRemove={controller.removeValue} onFieldClear={controller.clearValues} onReset={controller.reset} onApply={controller.apply} onClose={controller.dismiss} />
    </div>
    {field && container && createPortal(<div ref={controller.popupRef} className={styles.panelValuePopup}
      style={{ left: field.left, top: field.top, width: field.width }} role="dialog" aria-label={`Значения: ${reportFilterLabels[field.id]}`} data-panel-value-list={field.id}>
      <FilterValueList label={reportFilterLabels[field.id]} width={field.width} options={controller.options} totalOptionsCount={controller.totalOptionsCount}
        selectionMode={field.id === 'status' ? 'single' : 'multiple'}
        showSearch={controller.showSearch} searchValue={field.query} selectedValues={controller.selectedValues}
        onSearchChange={controller.search} onToggleValue={controller.toggle} />
    </div>, container)}
  </>, document.body);
}
