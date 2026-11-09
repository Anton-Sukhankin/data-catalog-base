import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { Group, Hand, Maximize2, Minimize2, Move } from 'lucide-react';
import type { ReportDataSource, ReportLineage } from './model';
import { OverflowText } from '../../../components/OverflowText/OverflowText';
import { defaultReportPosition, defaultScene, fitLineageBounds, lineagePath } from './lineageGeometry';
import type { Point } from './lineageGeometry';
import s from './Lineage.module.css';

const sceneWidth=1070;
const sceneHeight=500;
type Mode='pan'|'nodes';
type Gesture={pointerId:number;client:Point;start:Point;scale:number}&({kind:'pan'}|{kind:'node';id:string|null});
const categories=[
  ['report','Отчёт','#007bfc','#007bfc'], ['datahub','Источник DataHub','#edf8f3','#5c9a83'],
  ['catalog','Источник (каталог)','#fff0ee','#de9e95'], ['reports','Reports','#e8f8f2','#60b5a1'],
  ['cdm','CDM','#f3edfa','#a999c4'], ['clean','Clean','#eaf3fc','#82add2'], ['bclean','BClean','#fff3db','#cfab67'],
] as const;

function SourceIcon({catalog=false}:{catalog?:boolean}) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    {catalog?<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 3v18M12 7h5M12 11h5M12 15h5M6 7h1M6 11h1M6 15h1"/></>:<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/></>}
  </svg>;
}

export function LineageGraph({reportTitle,sources,graph}:{reportTitle:string;sources:readonly ReportDataSource[];graph:ReportLineage}) {
  const root=useRef<HTMLElement>(null);
  const viewport=useRef<HTMLDivElement>(null);
  const scene=useRef<HTMLDivElement>(null);
  const fullButton=useRef<HTMLButtonElement>(null);
  const wasFullscreen=useRef(false);
  const drag=useRef<Gesture|undefined>(undefined);
  const [mode,setMode]=useState<Mode>('pan');
  const [draggedNode,setDraggedNode]=useState<string|null|undefined>(undefined);
  const [panning,setPanning]=useState(false);
  const [nodePositions,setNodePositions]=useState<Readonly<Record<string,Point>>>({});
  const [reportPosition,setReportPosition]=useState<Point>(defaultReportPosition);
  const [viewBounds,setViewBounds]=useState(defaultScene);
  const [size,setSize]=useState({width:sceneWidth,height:sceneHeight});
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const [fullscreen,setFullscreen]=useState(false);
  const [error,setError]=useState('');
  const hint=useId();
  const scale=Math.min(1,size.width/viewBounds.width,size.height/viewBounds.height)*zoom;
  const x=(size.width-viewBounds.width*scale)/2-viewBounds.x*scale+pan.x;
  const y=(size.height-viewBounds.height*scale)/2-viewBounds.y*scale+pan.y;
  const stopDrag=useCallback(()=>{
    const gesture=drag.current;drag.current=undefined;setDraggedNode(undefined);setPanning(false);
    if(gesture&&viewport.current?.hasPointerCapture(gesture.pointerId))viewport.current.releasePointerCapture(gesture.pointerId);
  },[]);
  useEffect(()=>{window.addEventListener('blur',stopDrag);return()=>window.removeEventListener('blur',stopDrag);},[stopDrag]);
  useLayoutEffect(()=>{
    const el=viewport.current;
    if(!el)return;
    const resize=()=>setSize({width:el.clientWidth,height:el.clientHeight});
    resize();const observer=new ResizeObserver(resize);observer.observe(el);
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const change=()=>{const active=document.fullscreenElement===root.current;setFullscreen(active);if(!active&&wasFullscreen.current)fullButton.current?.focus();wasFullscreen.current=active;};
    document.addEventListener('fullscreenchange',change);
    return()=>document.removeEventListener('fullscreenchange',change);
  },[]);
  function changeZoom(delta:number){setZoom(value=>Math.min(2.5,Math.max(.5,Math.round((value+delta)*100)/100)));}
  function resetZoom(){
    const nodes=scene.current?.querySelectorAll<HTMLElement>('[data-lineage-node],[data-lineage-report]');
    setViewBounds(fitLineageBounds(Array.from(nodes??[],node=>({x:node.offsetLeft,y:node.offsetTop,width:node.offsetWidth,height:node.offsetHeight}))));
    setZoom(1);setPan({x:0,y:0});
  }
  function resetLayout(){stopDrag();setNodePositions({});setReportPosition(defaultReportPosition);setViewBounds(defaultScene);setZoom(1);setPan({x:0,y:0});}
  function selectMode(value:Mode){stopDrag();setMode(value);}
  function moveNode(id:string|null,position:Point){
    if(id===null)setReportPosition(position);
    else setNodePositions(previous=>({...previous,[id]:position}));
  }
  function startNodeDrag(event:PointerEvent<HTMLDivElement>,id:string|null,position:Point){
    if(mode!=='nodes'||event.button!==0)return;
    event.preventDefault();event.stopPropagation();event.currentTarget.focus();
    drag.current={kind:'node',id,pointerId:event.pointerId,client:{x:event.clientX,y:event.clientY},start:position,scale};
    setDraggedNode(id);viewport.current?.setPointerCapture(event.pointerId);
  }
  function nodeKeyboard(event:KeyboardEvent<HTMLDivElement>,id:string|null,position:Point){
    if(mode!=='nodes')return;
    if(event.key==='Escape'){stopDrag();return;}
    const step=event.shiftKey?32:12;
    const offsets:Record<string,Point>={ArrowLeft:{x:-step,y:0},ArrowRight:{x:step,y:0},ArrowUp:{x:0,y:-step},ArrowDown:{x:0,y:step}};
    const offset=offsets[event.key];
    if(offset){event.preventDefault();event.stopPropagation();moveNode(id,{x:position.x+offset.x,y:position.y+offset.y});}
  }
  async function toggleFullscreen(){
    try{
      if(document.fullscreenElement===root.current)await document.exitFullscreen();
      else await root.current?.requestFullscreen();
      setError('');
    }catch{setError('Браузер не разрешил полноэкранный режим.');}
  }
  function keyboard(event:KeyboardEvent<HTMLDivElement>){
    if(event.target!==event.currentTarget)return;
    const offsets:Record<string,[number,number]>={ArrowLeft:[32,0],ArrowRight:[-32,0],ArrowUp:[0,32],ArrowDown:[0,-32]};
    if(offsets[event.key]&&mode==='pan'){event.preventDefault();const [dx,dy]=offsets[event.key];setPan(value=>({x:value.x+dx,y:value.y+dy}));}
    else if(['+','=','-','Home'].includes(event.key)){
      event.preventDefault();if(event.key==='Home')resetZoom();else changeZoom(event.key==='-'?-.2:.2);
    }
  }
  const nodeById=new Map(sources.map(source=>[source.id,source]));
  const positions=new Map(graph.nodes.map(node=>[node.sourceId,nodePositions[node.sourceId]??node]));
  const reportPort={x:reportPosition.x+210,y:reportPosition.y+72};
  return <section className={s.lineage} ref={root} data-lineage>
    <header className={s.header}>
      <div className={s.heading}>
        <span className={s.headingIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 7.5V12M5 16.5V12h14v4.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/></svg></span>
        <div><h2>Происхождение данных</h2><p>Связи отчёта с источниками данных</p></div>
      </div>
      <div className={s.headerTools}>
        <ul className={s.legend} aria-label="Категории происхождения данных">{categories.map(([id,label,fill,border])=><li key={id}><span style={{background:fill,borderColor:border}}/>{label}</li>)}</ul>
        {fullscreen&&<button type="button" className={s.collapse} onClick={()=>void toggleFullscreen()}><Minimize2 width={16} height={16} strokeWidth={1.5} aria-hidden="true"/><span>Свернуть</span></button>}
      </div>
    </header>
    <div className={s.body}>
      <p id={hint} className={s.sr}>Выберите режим перемещения по холсту или перетаскивания блоков. В режиме блоков сфокусируйте блок и используйте стрелки; Shift увеличивает шаг. В режиме холста стрелки сдвигают вид. Плюс и минус меняют масштаб, Home возвращает масштаб по умолчанию.</p>
      <div className={s.viewport} ref={viewport} role="group" aria-label="Граф происхождения данных" aria-describedby={hint} tabIndex={0} data-zoom={zoom.toFixed(2)} data-mode={mode} data-dragging={panning||draggedNode!==undefined} onKeyDown={keyboard}
        onPointerDown={event=>{
          if(mode!=='pan'||event.button!==0||(event.target as Element).closest('button'))return;
          event.preventDefault();event.currentTarget.focus();drag.current={kind:'pan',pointerId:event.pointerId,client:{x:event.clientX,y:event.clientY},start:pan,scale};setPanning(true);event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event=>{
          const gesture=drag.current;if(!gesture||gesture.pointerId!==event.pointerId)return;
          const dx=event.clientX-gesture.client.x,dy=event.clientY-gesture.client.y;
          if(gesture.kind==='pan')setPan({x:gesture.start.x+dx,y:gesture.start.y+dy});
          else moveNode(gesture.id,{x:gesture.start.x+dx/gesture.scale,y:gesture.start.y+dy/gesture.scale});
        }}
        onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag}>
        <div className={s.scene} ref={scene} data-lineage-scene style={{transform:`translate(${x}px, ${y}px) scale(${scale})`}}>
          <svg width={sceneWidth} height={sceneHeight} className={s.edges} aria-hidden="true">
            {graph.edges.map(edge=>{
              const node=positions.get(edge.sourceId);const source=nodeById.get(edge.sourceId);if(!node||!source)return null;
              const path=lineagePath({x:node.x+160,y:node.y},reportPort);
              return <path key={edge.sourceId} data-lineage-edge={edge.sourceId} d={path} fill="none" stroke={source.category==='catalog'?'#ca8d83':'#7a9f8e'} strokeWidth="1.4" strokeDasharray="5 4" strokeLinecap="round"/>;
            })}
          </svg>
          <div className={s.reportNode} data-lineage-report data-dragging={draggedNode===null} style={{left:reportPosition.x,top:reportPosition.y}}
            role="group" aria-label={`Блок отчёта ${reportTitle}`} aria-describedby={hint} tabIndex={mode==='nodes'?0:-1}
            onPointerDown={event=>startNodeDrag(event,null,reportPosition)} onKeyDown={event=>nodeKeyboard(event,null,reportPosition)}>
            <span className={s.reportIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 3h8l4 4v14H6ZM14 3v5h4M9 12h6M9 16h6"/></svg></span>
            <div><strong><OverflowText className={s.reportName} fullText={reportTitle}>{reportTitle}</OverflowText></strong><span>Отчёт</span></div>
          </div>
          {graph.nodes.map(node=>{const source=nodeById.get(node.sourceId);if(!source)return null;const position=positions.get(node.sourceId)!;return <div key={node.sourceId} className={s.sourceNode} data-lineage-node={node.sourceId} data-category={source.category} data-dragging={draggedNode===node.sourceId} style={{left:position.x,top:position.y} as CSSProperties}
            role="group" aria-label={`Блок источника ${source.name}`} aria-describedby={hint} tabIndex={mode==='nodes'?0:-1}
            onPointerDown={event=>startNodeDrag(event,node.sourceId,position)} onKeyDown={event=>nodeKeyboard(event,node.sourceId,position)}>
            <div className={s.nodeContext}><span><SourceIcon catalog={source.category==='catalog'}/>{source.category==='catalog'?'Источник (каталог)':'Источник DataHub'}</span>{source.platform&&<span className={s.platform}>{source.platform}</span>}</div>
            <strong><OverflowText className={s.nodeName} fullText={source.name}>{source.name}</OverflowText></strong>
          </div>;})}
          <svg width={sceneWidth} height={sceneHeight} className={s.ports} aria-hidden="true">
            {graph.nodes.map(node=>{const position=positions.get(node.sourceId)!;return <circle key={node.sourceId} data-source-port={node.sourceId} cx={position.x+160} cy={position.y} r="4" fill="#fff" stroke={nodeById.get(node.sourceId)?.category==='catalog'?'#ca8d83':'#7a9f8e'} strokeWidth="1.5"/>;})}
            <circle data-report-port cx={reportPort.x} cy={reportPort.y} r="4" fill="#fff" stroke="#007bfc" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className={s.controls} role="group" aria-label="Управление графом">
          <button type="button" aria-label="Увеличить граф" title="Увеличить граф" disabled={zoom>=2.5} onClick={()=>changeZoom(.2)}>+</button>
          <button type="button" aria-label="Уменьшить граф" title="Уменьшить граф" disabled={zoom<=.5} onClick={()=>changeZoom(-.2)}>−</button>
          <button type="button" aria-label="Масштаб по умолчанию" title="Масштаб по умолчанию" onClick={resetZoom}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg></button>
          <span className={s.toolSeparator} aria-hidden="true"/>
          <button type="button" aria-label="Перетаскивать блоки" title="Перетаскивать блоки" aria-pressed={mode==='nodes'} onClick={()=>selectMode('nodes')}><Move width={16} height={16} strokeWidth={1.5} aria-hidden="true"/></button>
          <button type="button" aria-label="Перемещаться по холсту" title="Перемещаться по холсту" aria-pressed={mode==='pan'} onClick={()=>selectMode('pan')}><Hand width={16} height={16} strokeWidth={1.5} aria-hidden="true"/></button>
          <button type="button" aria-label="Группировка по умолчанию" title="Группировка по умолчанию" onClick={resetLayout}><Group width={16} height={16} strokeWidth={1.5} aria-hidden="true"/></button>
          <span className={s.toolSeparator} aria-hidden="true"/>
          <button type="button" ref={fullButton} aria-label={fullscreen?'Выйти из полного экрана':'Граф на полный экран'} title={fullscreen?'Выйти из полного экрана':'Граф на полный экран'} disabled={!document.fullscreenEnabled} onClick={()=>void toggleFullscreen()}>{fullscreen?<Minimize2 width={16} height={16} strokeWidth={1.5} aria-hidden="true"/>:<Maximize2 width={16} height={16} strokeWidth={1.5} aria-hidden="true"/>}</button>
        </div>
      </div>
      {error&&<p role="status" className={s.error}>{error}</p>}
    </div>
  </section>;
}
