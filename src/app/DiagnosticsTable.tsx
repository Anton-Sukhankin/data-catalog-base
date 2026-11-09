import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import type { DiagnosticRow } from '../data/demoGateway';

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, DiagnosticRow>();
const columns = helper.columns([
  helper.accessor('label', { header: 'Параметр' }),
  helper.accessor('value', { header: 'Значение примера' }),
]);

export function DiagnosticsTable({ data }: { data: DiagnosticRow[] }) {
  const table = useTable({ features, columns, data, getRowId: (row) => row.id });
  return (
    <table>
      <caption>Технический пример. Не таблица отчётов каталога.</caption>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th key={header.id} scope="col">
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getAllCells().map((cell) => (
              <td key={cell.id}><table.FlexRender cell={cell} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
