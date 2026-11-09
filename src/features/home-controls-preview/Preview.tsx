import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/base.css';
import { HomeControls } from '../../components/HomeControls/HomeControls';
import { SingleSelect } from '../../components/SingleSelect/SingleSelect';
import type { HomeControlsProps, HomeViewMode } from '../../components/HomeControls/HomeControls';
import { contributionTypes, newsCategories, presets } from './fixtures';
import type { PreviewPreset } from './fixtures';
import styles from './Preview.module.css';

const query = new URLSearchParams(window.location.search);
const initialPreset = presets.find(preset => preset.id === query.get('case')) ?? presets.find(preset => preset.id === 'table')!;
const frozen = query.get('freeze') === '1';
type Intent = { kind: 'tab' | 'segment' | 'contribution' | 'category' | 'view' | 'filter'; id: string };

function Demo({ preset }: { preset: PreviewPreset }) {
  const [tab, setTab] = useState(preset.initialTab);
  const [segment, setSegment] = useState(preset.initialSegment);
  const [category, setCategory] = useState('all');
  const [contribution, setContribution] = useState('contributors');
  const [view, setView] = useState<HomeViewMode>(preset.initialView);
  const [intents, setIntents] = useState<Intent[]>([]);
  function record(kind: Intent['kind'], id: string, apply: () => void) {
    setIntents(previous => [...previous, { kind, id }]);
    if (!frozen) apply();
  }
  const props: HomeControlsProps = {
    tabs: { ariaLabel:'Тип содержимого',items:preset.tabs,selectedId:tab,onChange:id=>record('tab',id,()=>setTab(id)) },
  };
  if (tab === 'reports') {
    props.segments = { ariaLabel:'Раздел отчётов',items:preset.reportSegments,selectedId:segment,onChange:id=>record('segment',id,()=>setSegment(id)) };
    if (!preset.empty || segment === 'favorites') {
      props.view = { value:view,onChange:value=>record('view',value,()=>setView(value)) };
      if (segment === 'favorites') props.onFilter = () => record('filter','reports',()=>{});
      if (segment === 'contribution') props.contribution = { ariaLabel:'Тип вклада',items:contributionTypes,selectedId:contribution,onChange:id=>record('contribution',id,()=>setContribution(id)) };
    }
  } else if (tab === 'news' && !preset.empty) {
    props.segments = { ariaLabel:'Категории новостей',items:newsCategories,selectedId:category,onChange:id=>record('category',id,()=>setCategory(id)) };
  }
  return <>
    <div className={styles.stage} data-preview-panel><HomeControls {...props} /></div>
    <aside className={styles.log} aria-label="Технический журнал намерений">
      <p>Выделение меняет внешний контроллер. Содержимое разделов и фильтрация данных здесь не реализуются.{frozen && ' В этом техническом тесте новые намерения не применяются к props.'}</p>
      <ol data-intent-log aria-live="polite">{intents.map((intent,index)=><li key={index} data-intent-kind={intent.kind} data-intent-id={intent.id}>{intent.kind}: {intent.id}</li>)}</ol>
    </aside>
  </>;
}

function Preview() {
  const [preset, setPreset] = useState(initialPreset);
  return <main className={styles.preview}>
    <aside className={styles.tools} aria-label="Технический просмотр I09a">
      <h1>I09a · Панель Главной</h1>
      <label>Источник <SingleSelect label="Источник" value={preset.id} onValueChange={value=>setPreset(presets.find(item=>item.id===value)!)} options={presets.map(item=>({value:item.id,label:item.label}))}/></label>
      <p>Только управляемые переключатели. Счётчики — переданные примеры макета.</p>
    </aside>
    <Demo key={preset.id} preset={preset} />
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>);
