import type { SidebarItem } from '../components/Sidebar/Sidebar';
import { demoAiSolutions } from './aiHub';
import { demoDictionaryGateway } from './dictionary';
import { demoMetricsGateway } from './metrics';
import { demoCatalogTitles } from './reportTable';
import { demoSourcesGateway } from './sources';
import { demoSystemReferencesGateway } from './systemReferences';
import { demoMailingTasks } from './tasks';

const dictionary = demoDictionaryGateway.read();

// Global navigation counts the available records before local filters and pagination.
export const navigationFixture: readonly SidebarItem[] = [
  { id: 'home', label: 'Главная', icon: '/icons/sidebar/home.svg' },
  { id: 'reports', label: 'Отчёты', icon: '/icons/sidebar/reports.svg', count: String(demoCatalogTitles.size) },
  { id: 'tasks', label: 'Задачи', icon: '/icons/sidebar/tasks.svg', count: String(demoMailingTasks.length) },
  { id: 'metrics', label: 'Метрики и показатели', icon: '/icons/sidebar/metrics.svg', count: String(demoMetricsGateway.list().length) },
  { id: 'sources', label: 'Источники', icon: '/icons/sidebar/sources.svg', count: String(demoSourcesGateway.list().length) },
  { id: 'dictionary', label: 'Бизнес-словарь', icon: '/icons/sidebar/dictionary.svg', count: String(dictionary.terms.length + dictionary.domains.length) },
  { id: 'ai', label: 'AI Hub', icon: '/icons/sidebar/ai-hub.svg', count: String(demoAiSolutions.length) },
  { id: 'systems', label: 'Справочники ИС', icon: '/icons/sidebar/systems.svg', count: String(demoSystemReferencesGateway.list().length) },
  { id: 'questions', label: 'Вопросы и ответы', icon: '/icons/sidebar/questions.svg' },
];
