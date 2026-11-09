import type { HomeControlOption, HomeViewMode } from '../../components/HomeControls/HomeControls';

const labels = [
  { id: 'reports', label: 'Отчёты' }, { id: 'sources', label: 'Источники' },
  { id: 'ai-hub', label: 'AI Hub' }, { id: 'news', label: 'Новости' },
] as const;
const reportLabels = [
  { id: 'favorites', label: 'Избранные' }, { id: 'subscriptions', label: 'Мои подписки' },
  { id: 'contribution', label: 'Вклад в каталог' },
] as const;
export const newsCategories: readonly HomeControlOption[] = [
  { id: 'all', label: 'Все', count: 9 }, { id: 'new', label: 'Новое', count: 4 },
  { id: 'important', label: 'Важное', count: 3 }, { id: 'changes', label: 'Изменения', count: 2, unselectedSurface: 'neutral' },
];
export const contributionTypes: readonly HomeControlOption[] = [
  { id: 'contributors', label: 'Контрибьюторы' }, { id: 'platforms', label: 'Платформы' },
];

export interface PreviewPreset {
  id: string;
  label: string;
  tabs: readonly HomeControlOption[];
  reportSegments: readonly HomeControlOption[];
  initialTab: string;
  initialSegment: string;
  initialView: HomeViewMode;
  empty: boolean;
}
function tabs(counts: readonly (number | undefined)[]): readonly HomeControlOption[] {
  return labels.map((item, index) => ({ ...item, count: counts[index] }));
}
function segments(counts: readonly number[]): readonly HomeControlOption[] {
  return reportLabels.map((item, index) => ({ ...item, count: counts[index] }));
}
const standardTabs = tabs([10,10,8,9]);
const otherTabs = tabs([undefined,undefined,undefined,9]);
export const presets: readonly PreviewPreset[] = [
  { id:'base',label:'Избранные · карточки',tabs:standardTabs,reportSegments:segments([28,5,5]),initialTab:'reports',initialSegment:'favorites',initialView:'cards',empty:false },
  { id:'table',label:'Избранные · таблица',tabs:standardTabs,reportSegments:segments([28,5,5]),initialTab:'reports',initialSegment:'favorites',initialView:'list',empty:false },
  { id:'subscriptions',label:'Подписки · карточки',tabs:otherTabs,reportSegments:segments([28,18,18]),initialTab:'reports',initialSegment:'subscriptions',initialView:'cards',empty:false },
  { id:'contribution',label:'Вклад · карточки',tabs:otherTabs,reportSegments:segments([28,18,18]),initialTab:'reports',initialSegment:'contribution',initialView:'cards',empty:false },
  { id:'news',label:'Новости · Все',tabs:otherTabs,reportSegments:segments([28,5,5]),initialTab:'news',initialSegment:'favorites',initialView:'cards',empty:false },
  // These are source display values, not totals computed from empty content.
  { id:'empty-favorites',label:'Пустое избранное',tabs:tabs([0,10,8,9]),reportSegments:segments([18,5,5]),initialTab:'reports',initialSegment:'favorites',initialView:'cards',empty:true },
  { id:'empty-subscriptions',label:'Пустые подписки',tabs:otherTabs,reportSegments:segments([28,0,5]),initialTab:'reports',initialSegment:'subscriptions',initialView:'cards',empty:true },
  { id:'empty-contribution',label:'Пустой вклад',tabs:otherTabs,reportSegments:segments([28,5,0]),initialTab:'reports',initialSegment:'contribution',initialView:'cards',empty:true },
  { id:'empty-news',label:'Пустые новости',tabs:tabs([undefined,undefined,undefined,0]),reportSegments:segments([28,5,5]),initialTab:'news',initialSegment:'favorites',initialView:'cards',empty:true },
];
