import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ListScrollIndicator } from '../../../components/ListScrollIndicator/ListScrollIndicator';
import type { KeyboardEvent, PointerEvent, ReactElement } from 'react';
import { Grid3x3, Group, Hand, Maximize2, Minimize2, Move, Square } from 'lucide-react';
import { Tooltip } from 'radix-ui';
import type { ReportDataSource, ReportLineage } from './model';
import { Accordion } from '../../../components/Accordion/Accordion';
import { OverflowText, TextTooltipSurface } from '../../../components/OverflowText/OverflowText';
import { defaultReportPosition, defaultScene, fitLineageBounds, lineageNodeSize, lineagePath, lineageRow } from './lineageGeometry';
import type { Point } from './lineageGeometry';
import s from './Lineage.module.css';

const { width:sceneWidth, height:sceneHeight }=defaultScene;
const toolbarReserve=48;
const fullscreenDuration=260;
type Mode='pan'|'nodes';
type Gesture={pointerId:number;client:Point;start:Point;scale:number}&({kind:'pan'}|{kind:'node';id:string|null});
const categories=[
  ['report','Отчёт','#007bfc','#007bfc'], ['datahub','Источник DataHub','#edf8f3','#5c9a83'],
  ['catalog','Источник (каталог)','#fff0ee','#de9e95'], ['reports','Reports','#e8f8f2','#60b5a1'],
  ['cdm','CDM','#f3edfa','#a999c4'], ['clean','Clean','#eaf3fc','#82add2'], ['bclean','BClean','#fff3db','#cfab67'],
] as const;

const sourceLegendColors = {
  report: ['#5c9a83', '#5c9a83'],
  catalog: ['#007bfc', '#007bfc'],
} as const;
type GraphNode = Pick<ReportDataSource,'id'|'name'|'category'|'platform'> |
  {id:string;name:string;category:'report';platform:'REPORT'};

function SourceIcon({catalog=false}:{catalog?:boolean}) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    {catalog?<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 3v18M12 7h5M12 11h5M12 15h5M6 7h1M6 11h1M6 15h1"/></>:<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/></>}
  </svg>;
}

function ReportIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M6 3h8l4 4v14H6ZM14 3v5h4M9 12h6M9 16h6"/>
  </svg>;
}

function ToolHint({label,container,children}:{label:string;container?:HTMLElement|null;children:ReactElement}) {
  return <Tooltip.Root>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <TextTooltipSurface text={label} container={container} side="left" />
  </Tooltip.Root>;
}

export function LineageGraph({reportTitle,sources,graph}:{reportTitle:string;sources:readonly ReportDataSource[];graph:ReportLineage}) {
  return <LineageCanvas title={reportTitle} nodes={sources} graph={graph}/>;
}

export function SourceLineageGraph({sourceTitle,reports}:{sourceTitle:string;reports:readonly {id:string;title:string}[]}) {
  const nodes:GraphNode[] = reports.map(report => ({id:report.id,name:report.title,category:'report',platform:'REPORT'}));
  const graph = {
    nodes: lineageRow(reports.map(({id}) => id)),
    edges: reports.map(({id}) => ({sourceId:id})),
  };
  return <LineageCanvas title={sourceTitle} nodes={nodes} graph={graph} isSource/>;
}

function LineageCanvas({title,nodes,graph,isSource=false}:{title:string;nodes:readonly GraphNode[];graph:ReportLineage;isSource?:boolean}) {
  const slot=useRef<HTMLDivElement>(null);
  const fullscreenFrame=useRef<HTMLDivElement>(null);
  const viewport=useRef<HTMLDivElement>(null);
  const scene=useRef<HTMLDivElement>(null);
  const fullButton=useRef<HTMLButtonElement>(null);
  const wasFullscreen=useRef(false);
  const inlineBounds=useRef<DOMRect>(undefined);
  const fullscreenMotion=useRef<Animation>(undefined);
  const fullscreenPending=useRef(false);
  const drag=useRef<Gesture|undefined>(undefined);
  const [mode,setMode]=useState<Mode>('pan');
  const [draggedNode,setDraggedNode]=useState<string|null|undefined>(undefined);
  const [panning,setPanning]=useState(false);
  const [nodePositions,setNodePositions]=useState<Readonly<Record<string,Point>>>({});
  const [reportPosition,setReportPosition]=useState<Point>(defaultReportPosition);
  const initialBounds=fitLineageBounds(graph.nodes.map(node=>({...node,...lineageNodeSize})));
  const [viewBounds,setViewBounds]=useState(initialBounds);
  const [size,setSize]=useState({width:sceneWidth,height:sceneHeight});
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const [fullscreen,setFullscreen]=useState(false);
  const [open,setOpen]=useState(true);
  const [showGrid,setShowGrid]=useState(true);
  const [error,setError]=useState('');
  const tooltipContainer=fullscreen ? fullscreenFrame.current : undefined;
  const fullscreenLabel=fullscreen ? 'Выйти из полного экрана' : 'Граф на полный экран';
  const hint=useId();
  const sceneAreaWidth=Math.max(1,size.width-toolbarReserve);
  const scale=Math.min(1,sceneAreaWidth/viewBounds.width,size.height/viewBounds.height)*zoom;
  const x=(sceneAreaWidth-viewBounds.width*scale)/2-viewBounds.x*scale+pan.x;
  const y=(size.height-viewBounds.height*scale)/2-viewBounds.y*scale+pan.y;
  const gridSpacing=Math.max(1,24*scale);
  const gridOpacity=Math.min(1,Math.max(0,(gridSpacing-8)/8));
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
  },[fullscreen,open]);
  useEffect(()=>{
    const change=()=>setFullscreen(document.fullscreenElement===fullscreenFrame.current);
    document.addEventListener('fullscreenchange',change);
    return()=>{
      document.removeEventListener('fullscreenchange',change);
      fullscreenMotion.current?.cancel();
    };
  },[]);
  useLayoutEffect(()=>{
    if(fullscreen===wasFullscreen.current)return;
    if(fullscreen)animateFullscreen(true,inlineBounds.current);
    else {
      fullscreenMotion.current?.cancel();
      fullscreenMotion.current=undefined;
    }
    fullButton.current?.focus({preventScroll:true});
    wasFullscreen.current=fullscreen;
  },[fullscreen]);
  function changeZoom(delta:number){setZoom(value=>Math.min(2.5,Math.max(.5,Math.round((value+delta)*100)/100)));}
  function resetZoom(){
    const nodes=scene.current?.querySelectorAll<HTMLElement>('[data-lineage-node],[data-lineage-report]');
    setViewBounds(fitLineageBounds(Array.from(nodes??[],node=>({x:node.offsetLeft,y:node.offsetTop,width:node.offsetWidth,height:node.offsetHeight}))));
    setZoom(1);setPan({x:0,y:0});
  }
  function resetLayout(){stopDrag();setNodePositions({});setReportPosition(defaultReportPosition);setViewBounds(initialBounds);setZoom(1);setPan({x:0,y:0});}
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
  function animateFullscreen(entering:boolean,bounds:DOMRect|undefined) {
    const el=viewport.current;
    const currentTransform=!entering&&el?getComputedStyle(el).transform:undefined;
    fullscreenMotion.current?.cancel();
    fullscreenMotion.current=undefined;
    const frame=fullscreenFrame.current;
    if(!el?.animate||!frame||!bounds?.width||!bounds.height||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const target=frame.getBoundingClientRect();
    if(!target.width||!target.height)return;
    const embedded={transform:`translate(${bounds.left-target.left}px, ${bounds.top-target.top}px) scale(${bounds.width/target.width}, ${bounds.height/target.height})`};
    const expanded={transform:currentTransform&&currentTransform!=='none'?currentTransform:'translate(0, 0) scale(1, 1)'};
    try{
      fullscreenMotion.current=el.animate(entering?[embedded,expanded]:[expanded,embedded],{
        duration:fullscreenDuration,easing:'cubic-bezier(.22,1,.36,1)',fill:entering?'none':'forwards',
      });
      return fullscreenMotion.current;
    }catch{
      return undefined;
    }
  }
  async function toggleFullscreen(){
    const frame=fullscreenFrame.current;
    if(!frame||fullscreenPending.current)return;
    stopDrag();
    fullscreenPending.current=true;
    try{
      if(document.fullscreenElement===frame){
        const animation=animateFullscreen(false,slot.current?.getBoundingClientRect());
        if(animation)await new Promise<void>(resolve=>{
          const timer=window.setTimeout(resolve,fullscreenDuration+100);
          const finish=()=>{window.clearTimeout(timer);resolve();};
          void animation.finished.then(finish,finish);
        });
        if(document.fullscreenElement===frame)await document.exitFullscreen();
      }else{
        inlineBounds.current=slot.current?.getBoundingClientRect();
        await frame.requestFullscreen();
      }
      setError('');
    }catch{
      fullscreenMotion.current?.cancel();
      setError('Браузер не разрешил изменить полноэкранный режим.');
    }finally{
      fullscreenPending.current=false;
    }
  }
  function keyboard(event:KeyboardEvent<HTMLDivElement>){
    if(event.target!==event.currentTarget)return;
    const offsets:Record<string,[number,number]>={ArrowLeft:[32,0],ArrowRight:[-32,0],ArrowUp:[0,32],ArrowDown:[0,-32]};
    if(offsets[event.key]&&mode==='pan'){event.preventDefault();const [dx,dy]=offsets[event.key];setPan(value=>({x:value.x+dx,y:value.y+dy}));}
    else if(['+','=','-','Home'].includes(event.key)){
      event.preventDefault();if(event.key==='Home')resetZoom();else changeZoom(event.key==='-'?-.2:.2);
    }
  }
  const nodeById=new Map(nodes.map(node=>[node.id,node]));
  const positions=new Map(graph.nodes.map(node=>[node.sourceId,nodePositions[node.sourceId]??node]));
  const reportPort={x:reportPosition.x+lineageNodeSize.width/2,y:reportPosition.y+lineageNodeSize.height};
  const content=<div className={s.body}>
      <div className={s.viewportSlot} ref={slot}>
      <div className={s.fullscreenFrame} ref={fullscreenFrame} data-lineage-fullscreen>
      {fullscreen && <ListScrollIndicator scope={fullscreenFrame} />}
      <p id={hint} className={s.sr}>Выберите режим перемещения по холсту или перетаскивания блоков. В режиме блоков сфокусируйте блок и используйте стрелки; Shift увеличивает шаг. В режиме холста стрелки сдвигают вид. Плюс и минус меняют масштаб, Home возвращает масштаб по умолчанию.</p>
      <div className={s.viewport} ref={viewport} role="group" aria-label="Граф происхождения данных" aria-describedby={hint} tabIndex={0} data-zoom={zoom.toFixed(2)} data-mode={mode} data-dragging={panning||draggedNode!==undefined} onKeyDown={keyboard}
        onPointerDown={event=>{
          if(mode!=='pan'||event.button!==0||(event.target as Element).closest('button,[data-lineage-legend],[data-lineage-grid-control]'))return;
          event.preventDefault();event.currentTarget.focus();drag.current={kind:'pan',pointerId:event.pointerId,client:{x:event.clientX,y:event.clientY},start:pan,scale};setPanning(true);event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event=>{
          const gesture=drag.current;if(!gesture||gesture.pointerId!==event.pointerId)return;
          const dx=event.clientX-gesture.client.x,dy=event.clientY-gesture.client.y;
          if(gesture.kind==='pan')setPan({x:gesture.start.x+dx,y:gesture.start.y+dy});
          else moveNode(gesture.id,{x:gesture.start.x+dx/gesture.scale,y:gesture.start.y+dy/gesture.scale});
        }}
        onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag}>
        {showGrid&&<div className={s.grid} data-lineage-grid aria-hidden="true" style={{
          backgroundSize:`${gridSpacing}px ${gridSpacing}px`,
          backgroundPosition:`${x}px ${y}px`,
          opacity:gridOpacity,
        }}/>}
        <div className={s.scene} ref={scene} data-lineage-scene style={{width:sceneWidth,height:sceneHeight,transform:`translate(${x}px, ${y}px) scale(${scale})`}}>
          <svg width={sceneWidth} height={sceneHeight} className={s.edges} aria-hidden="true">
            {graph.edges.map(edge=>{
              const node=positions.get(edge.sourceId);const source=nodeById.get(edge.sourceId);if(!node||!source)return null;
              const childPort={x:node.x+lineageNodeSize.width/2,y:node.y};
              const path=lineagePath(childPort,reportPort);
              return <path key={edge.sourceId} data-lineage-edge={edge.sourceId} d={path} fill="none" stroke={source.category==='catalog'?'#ca8d83':'#7a9f8e'} strokeWidth="1.4" strokeDasharray="5 4" strokeLinecap="round"/>;
            })}
          </svg>
          <div className={s.reportNode} data-lineage-report data-dragging={draggedNode===null} style={{...lineageNodeSize,left:reportPosition.x,top:reportPosition.y}}
            role="group" aria-label={`${isSource?'Текущий источник':'Блок отчёта'} ${title}`} aria-describedby={hint} tabIndex={mode==='nodes'?0:-1}
            onPointerDown={event=>startNodeDrag(event,null,reportPosition)} onKeyDown={event=>nodeKeyboard(event,null,reportPosition)}>
            <span className={s.nodeIcon}>{isSource?<SourceIcon/>:<ReportIcon/>}</span>
            <div className={s.nodeText}>
              <strong><OverflowText className={s.nodeName} fullText={title} tooltipContainer={tooltipContainer}>{title}</OverflowText></strong>
              {isSource&&<span className={s.nodeContext}>Текущий источник</span>}
            </div>
          </div>
          {graph.nodes.map(node=>{
            const source=nodeById.get(node.sourceId);
            if(!source)return null;
            const position=positions.get(node.sourceId)!;
            const catalog=source.category==='catalog';
            return <div key={node.sourceId} className={s.sourceNode} data-lineage-node={node.sourceId} data-category={source.category}
              data-dragging={draggedNode===node.sourceId} style={{...lineageNodeSize,left:position.x,top:position.y}}
              role="group" aria-label={`${isSource?'Блок отчёта':'Блок источника'} ${source.name}`} aria-describedby={hint} tabIndex={mode==='nodes'?0:-1}
              onPointerDown={event=>startNodeDrag(event,node.sourceId,position)} onKeyDown={event=>nodeKeyboard(event,node.sourceId,position)}>
              <span className={s.nodeIcon}>{isSource?<ReportIcon/>:<SourceIcon catalog={catalog}/>}</span>
              <div className={s.nodeText}>
                <strong><OverflowText className={s.nodeName} fullText={source.name} tooltipContainer={tooltipContainer}>{source.name}</OverflowText></strong>
                {source.platform&&<OverflowText className={s.nodeContext} fullText={source.platform} tooltipContainer={tooltipContainer}>{source.platform}</OverflowText>}
              </div>
            </div>;
          })}
          <svg width={sceneWidth} height={sceneHeight} className={s.ports} aria-hidden="true">
            {graph.nodes.map(node=>{const position=positions.get(node.sourceId)!;return <circle key={node.sourceId} data-source-port={node.sourceId} cx={position.x+lineageNodeSize.width/2} cy={position.y} r="4" fill="#fff" stroke={nodeById.get(node.sourceId)?.category==='catalog'?'#ca8d83':'#7a9f8e'} strokeWidth="1.5"/>;})}
            <circle data-report-port cx={reportPort.x} cy={reportPort.y} r="4" fill="#fff" stroke="#007bfc" strokeWidth="1.5"/>
          </svg>
        </div>
        <ul className={s.legend} data-lineage-legend aria-label="Категории происхождения данных">
          {categories.map(([id,label,fill,border])=>{
            const [background,borderColor]=isSource&&(id==='report'||id==='catalog')?sourceLegendColors[id]:[fill,border];
            return <li key={id}><span style={{background,borderColor}} aria-hidden="true"/>{label}</li>;
          })}
        </ul>
        <Tooltip.Provider delayDuration={350} disableHoverableContent>
        <div className={s.controls} role="group" aria-label="Управление графом">
          <ToolHint label="Увеличить граф" container={tooltipContainer}>
            <button type="button" aria-label="Увеличить граф" aria-disabled={zoom>=2.5} onClick={()=>changeZoom(.2)}>+</button>
          </ToolHint>
          <ToolHint label="Уменьшить граф" container={tooltipContainer}>
            <button type="button" aria-label="Уменьшить граф" aria-disabled={zoom<=.5} onClick={()=>changeZoom(-.2)}>−</button>
          </ToolHint>
          <ToolHint label="Масштаб по умолчанию" container={tooltipContainer}>
            <button type="button" aria-label="Масштаб по умолчанию" onClick={resetZoom}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg></button>
          </ToolHint>
          <span className={s.toolSeparator} aria-hidden="true"/>
          <ToolHint label="Перетаскивать блоки" container={tooltipContainer}>
            <button type="button" aria-label="Перетаскивать блоки" aria-pressed={mode==='nodes'} onClick={()=>selectMode('nodes')}><Move width={16} height={16} strokeWidth={1.5} aria-hidden="true"/></button>
          </ToolHint>
          <ToolHint label="Перемещаться по холсту" container={tooltipContainer}>
            <button type="button" aria-label="Перемещаться по холсту" aria-pressed={mode==='pan'} onClick={()=>selectMode('pan')}><Hand width={16} height={16} strokeWidth={1.5} aria-hidden="true"/></button>
          </ToolHint>
          <ToolHint label="Группировка по умолчанию" container={tooltipContainer}>
            <button type="button" aria-label="Группировка по умолчанию" onClick={resetLayout}><Group width={16} height={16} strokeWidth={1.5} aria-hidden="true"/></button>
          </ToolHint>
          <span className={s.toolSeparator} aria-hidden="true"/>
          <div className={s.gridControl} data-lineage-grid-control role="radiogroup" aria-label="Фон холста" aria-orientation="vertical">
            <ToolHint label="С сеткой" container={tooltipContainer}>
              <label>
                <input type="radio" name={`${hint}-grid`} aria-label="С сеткой" checked={showGrid} onChange={()=>setShowGrid(true)}/>
                <Grid3x3 size={16} strokeWidth={1.5} aria-hidden="true"/>
              </label>
            </ToolHint>
            <ToolHint label="Без сетки" container={tooltipContainer}>
              <label>
                <input type="radio" name={`${hint}-grid`} aria-label="Без сетки" checked={!showGrid} onChange={()=>setShowGrid(false)}/>
                <Square size={16} strokeWidth={1.5} aria-hidden="true"/>
              </label>
            </ToolHint>
          </div>
          <span className={s.toolSeparator} aria-hidden="true"/>
          <ToolHint label={fullscreenLabel} container={tooltipContainer}>
            <button type="button" ref={fullButton} aria-label={fullscreenLabel} aria-disabled={!document.fullscreenEnabled} onClick={()=>{if(document.fullscreenEnabled)void toggleFullscreen();}}>
              {fullscreen?<Minimize2 size={16} strokeWidth={1.5} aria-hidden="true"/>:<Maximize2 size={16} strokeWidth={1.5} aria-hidden="true"/>}
            </button>
          </ToolHint>
        </div>
        </Tooltip.Provider>
        {error&&<p role="status" className={s.error}>{error}</p>}
      </div>
      </div>
      </div>
    </div>;
  return <section className={`${s.lineage}${isSource?` ${s.sourceLineage}`:''}`} data-lineage data-fullscreen={fullscreen||undefined}>
    {isSource ? content : <Accordion title="Происхождение данных" description="Связи отчёта с источниками данных"
      open={open} onOpenChange={setOpen} bodyInset="flush">
      {content}
    </Accordion>}
  </section>;
}
