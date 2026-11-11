import type { CSSProperties } from 'react';
import { ChevronRight, Folder, Server, Table2 } from 'lucide-react';
import { DetailBreadcrumbs } from '../../components/DetailHeader/DetailBreadcrumbs';
import { RoundIconButton } from '../../components/RoundIconButton/RoundIconButton';
import type { SourceSummary } from '../../data/sources';
import s from './Sources.module.css';

type Branch = {
  key: string;
  path: readonly string[];
  count: number;
  groups: Map<string, Branch>;
  sources: SourceSummary[];
};

const branchKey = (path: readonly string[]) => JSON.stringify(path);

function buildTree(rows: readonly SourceSummary[]) {
  const root: Branch = {key:'',path:[],count:0,groups:new Map(),sources:[]};
  const branches = new Map<string, Branch>();
  for (const row of rows) {
    let parent = root;
    for (const label of [row.platform || 'Неизвестная платформа', ...(row.treePath ?? [])]) {
      let group = parent.groups.get(label);
      if (!group) {
        const path = [...parent.path,label];
        const key = branchKey(path);
        group = {key,path,count:0,groups:new Map(),sources:[]};
        parent.groups.set(label,group);
        branches.set(key,group);
      }
      group.count++;
      parent = group;
    }
    parent.sources.push(row);
  }
  return {root,branches};
}

type TreeActions = {
  closed: ReadonlySet<string>;
  bookmarks: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onBookmark: (id: string) => void;
  onOpen: (source: SourceSummary, branch: string) => void;
};

function TreeEntries({branch,actions}:{branch:Branch;actions:TreeActions}) {
  const depth = branch.path.length;
  return <ul className={s.treeEntries} role="list">
    {[...branch.groups].sort(([a],[b])=>a.localeCompare(b,'ru')).map(([label,group]) => {
      const expanded = !actions.closed.has(group.key);
      return <li key={group.key} data-source-tree-branch={label} style={{'--source-tree-depth':depth} as CSSProperties}>
        <button type="button" className={s.treeRow} aria-expanded={expanded} onClick={()=>actions.onToggle(group.key)}>
          <span className={s.treeGroupIdentity}>
            <ChevronRight className={s.treeChevron} size={16} aria-hidden="true" />
            {depth === 0 ? <Server size={16} data-source-tree-group-icon aria-hidden="true" /> : <Folder size={16} data-source-tree-group-icon aria-hidden="true" />}
            <span>{label}</span>
          </span>
          <span className={s.treeCount} data-source-tree-count>{group.count.toLocaleString('ru-RU')}</span>
        </button>
        <div className={s.treeReveal} data-source-tree-reveal data-open={expanded} aria-hidden={!expanded} inert={!expanded}>
          <div className={s.treeClip}>
            <TreeEntries branch={group} actions={actions} />
          </div>
        </div>
      </li>;
    })}
    {branch.sources.map(source => <li key={source.id} data-source-id={source.id} style={{'--source-tree-depth':depth} as CSSProperties}>
      <div className={s.treeRow}>
        <div className={s.treeSourceIdentity}>
          <RoundIconButton icon="bookmark" className={s.treeBookmark} aria-label={`Закладка ${source.technicalName}`}
            aria-pressed={actions.bookmarks.has(source.id)} onClick={()=>actions.onBookmark(source.id)} />
          <Table2 size={16} aria-hidden="true" />
          <button type="button" className={s.treeSourceName} onClick={()=>actions.onOpen(source,branch.key)}>{source.technicalName}</button>
        </div>
        <span className={s.treeCount} data-source-tree-count>{source.columns.toLocaleString('ru-RU')} кол.</span>
      </div>
    </li>)}
  </ul>;
}

export function SourceTree({rows,activeKey,closedKeys,bookmarks,onBookmark,onChange,onOpen}:{
  rows: readonly SourceSummary[];
  activeKey: string | null;
  closedKeys: readonly string[];
  bookmarks: ReadonlySet<string>;
  onBookmark: TreeActions['onBookmark'];
  onChange: (active: string, closed: readonly string[]) => void;
  onOpen: TreeActions['onOpen'];
}) {
  const {root,branches} = buildTree(rows);
  const active = activeKey ? branches.get(activeKey) : undefined;
  const path = active?.path ?? [];
  const closed = new Set(closedKeys);

  function toggle(key: string) {
    const next = new Set(closed);
    if (next.has(key)) next.delete(key); else next.add(key);
    onChange(key,[...next]);
  }
  const ancestors = path.length ? ['Источники', ...path.slice(0,-1)].map(label => ({label})) : [];
  return <section className={s.tree} aria-label="Дерево источников" data-source-tree>
    <div className={s.treeHeader} data-source-tree-header>
      <DetailBreadcrumbs ancestors={ancestors} current={path.at(-1) ?? 'Источники'} pathLabel="Путь ветки" />
    </div>
    <div className={s.treeScroll} data-list-scroll tabIndex={0} aria-label="Прокрутка дерева источников">
      <div className={s.treeBody} data-source-tree-body>
        <TreeEntries branch={root} actions={{closed,bookmarks,onToggle:toggle,onBookmark,onOpen}} />
      </div>
    </div>
  </section>;
}
