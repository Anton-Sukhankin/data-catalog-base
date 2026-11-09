import { OverflowText } from '../../components/OverflowText/OverflowText';
import searchStyles from '../../components/Search/SearchField.module.css';
import { StrictMode, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { icons, ArrowLeft, ChevronLeft, ChevronRight, Copy, Download, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Field, FieldGroup, FieldLabel } from './ui/field';
import './styles.css';

type IconName = keyof typeof icons;
const names = (Object.keys(icons) as IconName[]).sort((a,b)=>a.localeCompare(b,'en'));
const pageSize = 96;
const aliases: Array<[string,string]> = [
  ['file','документ отчёт отчет файл'],['chart','график диаграмма аналитика метрика'],
  ['search','поиск лупа'],['filter','фильтр'],['funnel','фильтр воронка'],
  ['database','база данные источник'],['table','таблица'],['layout','вид интерфейс'],
  ['chevron','стрелка раскрыть свернуть'],['arrow','стрелка переход'],['user','пользователь владелец'],
  ['bell','уведомление подписка'],['mail','почта письмо'],['settings','настройки'],
  ['menu','меню'],['circlecheck','проверено статус'],['bookmark','избранное закладка'],
  ['house','главная дом'],['newspaper','новости'],['brain','интеллект'],
];
const normalized = (value:string)=>value.toLocaleLowerCase('ru').replace(/[\s_-]/g,'').replaceAll('ё','е');
const searchIndex = names.map(name=>({name,text:normalized(`${name} ${aliases.filter(([key])=>name.toLowerCase().includes(key)).map(([,text])=>text).join(' ')}`)}));

function Catalog() {
  const [query,setQuery] = useState('');
  const [page,setPage] = useState(0);
  const [size,setSize] = useState(24);
  const [stroke,setStroke] = useState(1.5);
  const [selected,setSelected] = useState<IconName>('FileText');
  const [notice,setNotice] = useState('');
  const preview = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const matches = useMemo(()=>searchIndex.filter(item=>item.text.includes(normalized(query))).map(item=>item.name),[query]);
  const pages = Math.max(1,Math.ceil(matches.length/pageSize));
  const pageIndex = Math.min(page,pages-1);
  const visible = matches.slice(pageIndex*pageSize,(pageIndex+1)*pageSize);
  const SelectedIcon = icons[selected];
  const settings = {'--catalog-icon-size':`${size}px`} as CSSProperties;
  function turn(next:number) {setPage(next);grid.current?.scrollIntoView({block:'start'});}
  async function copy() {
    try { await navigator.clipboard.writeText(selected);setNotice(`Название ${selected} скопировано`); }
    catch { setNotice(`Не удалось скопировать автоматически. Название: ${selected}`); }
  }
  function download() {
    const source = preview.current?.querySelector('svg');if(!source)return;
    const svg = source.cloneNode(true) as SVGElement;
    svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width',String(size));svg.setAttribute('height',String(size));
    svg.setAttribute('stroke','#101d3b');svg.removeAttribute('class');svg.removeAttribute('style');svg.removeAttribute('aria-hidden');
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
    const link = document.createElement('a');link.href=url;link.download=`${selected}.svg`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice(`SVG ${selected} подготовлен`);
  }
  return <main className="catalog-shell">
    <header className="catalog-header">
      <Button variant="ghost" asChild><a href="/preview/navigation"><ArrowLeft data-icon="inline-start" />К прототипу</a></Button>
      <div className="catalog-heading"><h1>Библиотека иконок</h1><Badge variant="secondary">Lucide · {names.length}</Badge></div>
      <p>Выберите иконку, чтобы рассмотреть её и сохранить название. В интерфейсе прототипа замены выполняются отдельно.</p>
      <div className="catalog-settings">
        <FieldGroup>
          <Field><FieldLabel htmlFor="icon-search">Найти иконку</FieldLabel><div className="catalog-search"><Input id="icon-search" type="search" className={searchStyles.surface} placeholder="Например: FileText, график, поиск" value={query} onChange={event=>{setQuery(event.target.value);setPage(0);}} />{query&&<Button variant="ghost" size="icon" aria-label="Очистить поиск" onClick={()=>{setQuery('');setPage(0);}}><X /></Button>}</div></Field>
        </FieldGroup>
        <Field><FieldLabel htmlFor="icon-size">Размер · {size} px</FieldLabel><Input id="icon-size" type="range" min="16" max="40" step="4" value={size} onChange={event=>setSize(Number(event.target.value))} /></Field>
        <Field><FieldLabel htmlFor="icon-stroke">Толщина · {stroke}</FieldLabel><Input id="icon-stroke" type="range" min="1" max="3" step="0.25" value={stroke} onChange={event=>setStroke(Number(event.target.value))} /></Field>
      </div>
    </header>
    <div className="catalog-layout">
      <section aria-label="Все иконки" className="catalog-results">
        <div className="catalog-results-heading"><p role="status">Найдено: {matches.length} из {names.length}</p><span>Страница {pageIndex+1} из {pages}</span></div>
        <div ref={grid} className="catalog-grid" style={settings}>
          {visible.map(name=>{const Icon=icons[name];return <Button key={name} variant={selected===name?'secondary':'outline'} size="tile" aria-label={name} aria-pressed={selected===name} onClick={()=>{setSelected(name);setNotice('');}} data-catalog-icon={name}><Icon strokeWidth={stroke} aria-hidden="true" /><OverflowText className="catalog-icon-name" fullText={name}>{name}</OverflowText></Button>;})}
        </div>
        {matches.length===0&&<Card><CardHeader><CardTitle>Иконки не найдены</CardTitle><CardDescription>Попробуйте другое название: file, chart, user или database.</CardDescription></CardHeader><CardFooter><Button variant="secondary" onClick={()=>{setQuery('');setPage(0);}}>Сбросить поиск</Button></CardFooter></Card>}
        {matches.length>0&&<nav className="catalog-pagination" aria-label="Страницы иконок"><Button variant="outline" disabled={pageIndex===0} onClick={()=>turn(pageIndex-1)}><ChevronLeft data-icon="inline-start" />Назад</Button><span>{pageIndex*pageSize+1}–{Math.min((pageIndex+1)*pageSize,matches.length)} из {matches.length}</span><Button variant="outline" disabled={pageIndex===pages-1} onClick={()=>turn(pageIndex+1)}>Далее<ChevronRight data-icon="inline-end" /></Button></nav>}
      </section>
      <aside className="catalog-detail" aria-label="Выбранная иконка">
        <Card><CardHeader><CardTitle>{selected}</CardTitle><CardDescription>Предпросмотр иконки Lucide</CardDescription></CardHeader><CardContent><div ref={preview} className="catalog-large-preview"><SelectedIcon size={96} strokeWidth={stroke} aria-hidden="true" /></div><p className="catalog-detail-caption">В интерфейсе: {size} × {size} px · линия {stroke}</p><div className="catalog-real-preview"><SelectedIcon size={size} strokeWidth={stroke} aria-hidden="true" /><span>Пример подписи</span></div></CardContent><CardFooter className="flex-col items-stretch gap-2"><Button variant="default" onClick={copy}><Copy data-icon="inline-start" />Скопировать название</Button><Button variant="outline" onClick={download}><Download data-icon="inline-start" />Скачать SVG</Button><p className="catalog-copy-status" role="status">{notice}</p></CardFooter></Card>
        <p className="catalog-license">Иконки доступны по лицензии ISC. <a href="/licenses/lucide.txt" target="_blank" rel="noreferrer">Условия использования</a></p>
      </aside>
    </div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Catalog /></StrictMode>);
