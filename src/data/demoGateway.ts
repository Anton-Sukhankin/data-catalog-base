export interface DiagnosticRow {
  id: string;
  label: string;
  value: string;
}

// Only a technical fixture. This is not a catalogue entity or a future API schema.
export interface DiagnosticsGateway {
  read(signal?: AbortSignal): Promise<DiagnosticRow[]>;
}

export const diagnosticFixture: readonly DiagnosticRow[] = [
  { id: 'source', label: 'Источник', value: 'Локальный демонстрационный пример' },
  { id: 'domain', label: 'Область', value: 'Проверка подготовки, без данных каталога' },
  { id: 'backend', label: 'Бэкенд', value: 'Не подключён' },
];

export const demoDiagnostics: DiagnosticsGateway = {
  async read(signal) {
    signal?.throwIfAborted();
    return diagnosticFixture.map((row) => ({ ...row }));
  },
};

export const DEMO_PATH = '/__prototype_demo__/diagnostics';

function isDiagnosticRow(value: unknown): value is DiagnosticRow {
  if (typeof value !== 'object' || value === null) return false;
  return 'id' in value && typeof value.id === 'string'
    && 'label' in value && typeof value.label === 'string'
    && 'value' in value && typeof value.value === 'string';
}

// Explicitly opt-in HTTP imitation for development/testing, never an assumed backend.
export function createHttpDiagnostics(origin: string): DiagnosticsGateway {
  return {
    async read(signal) {
      const response = await fetch(new URL(DEMO_PATH, origin), { signal });
      if (!response.ok) throw new Error('Демонстрационный источник недоступен');
      const data: unknown = await response.json();
      if (!Array.isArray(data) || !data.every(isDiagnosticRow)) {
        throw new Error('Некорректный формат демонстрационных данных');
      }
      return data;
    },
  };
}
