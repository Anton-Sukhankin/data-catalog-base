import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import styles from './Sidebar.module.css';

const defaultWidth = 280;
const minWidth = 200;
const maxWidth = 400;
const resizeStep = 16;

function clampWidth(width: number) {
  return Math.min(maxWidth, Math.max(minWidth, Math.round(width)));
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  count?: string;
}

interface SidebarProps {
  items: readonly SidebarItem[];
  activeId: string;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function Sidebar({ items, activeId, collapsed, onSelect, onCollapsedChange }: SidebarProps) {
  const menuId = useId();
  const sidebar = useRef<HTMLElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);
  const [width, setWidth] = useState(defaultWidth);
  const [resizing, setResizing] = useState(false);

  function startResize(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || drag.current || !sidebar.current) return;
    event.preventDefault();
    const startWidth = sidebar.current.getBoundingClientRect().width;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
    setWidth(clampWidth(startWidth));
    setResizing(true);
  }

  function moveBoundary(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (gesture?.pointerId !== event.pointerId) return;
    setWidth(clampWidth(gesture.startWidth + event.clientX - gesture.startX));
  }

  function finishResize(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setResizing(false);
  }

  function resizeFromKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      setWidth(defaultWidth);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const delta = event.key === 'ArrowLeft' ? -resizeStep : resizeStep;
      setWidth(current => clampWidth(current + delta));
    }
  }

  function togglePanel() {
    if (collapsed) setWidth(defaultWidth);
    onCollapsedChange(!collapsed);
  }

  return (
    <aside ref={sidebar} className={styles.sidebar} data-collapsed={collapsed}
      data-resizing={resizing}
      style={{ '--sidebar-expanded-width': `${width}px` } as CSSProperties}>
      <nav id={menuId} aria-label="Разделы каталога" className={styles.menu}>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.row}>
              <button
                type="button"
                className={styles.item}
                aria-label={item.label}
                aria-current={item.id === activeId ? 'page' : undefined}
                onClick={() => onSelect(item.id)}
              >
                <img className={styles.icon} src={item.icon} alt="" aria-hidden="true" />
                <span className={styles.text} aria-hidden={collapsed}>
                  <span className={styles.label}>{item.label}</span>
                  {item.count !== undefined && <span className={styles.count}>{item.count}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.boundary}>
        {!collapsed && <div className={styles.resizeHandle} role="separator" tabIndex={0}
          aria-label="Ширина боковой панели" aria-orientation="vertical" aria-controls={menuId}
          aria-valuemin={minWidth} aria-valuemax={maxWidth} aria-valuenow={width}
          onPointerDown={startResize} onPointerMove={moveBoundary} onPointerUp={finishResize}
          onPointerCancel={finishResize} onLostPointerCapture={finishResize}
          onDoubleClick={() => setWidth(defaultWidth)} onKeyDown={resizeFromKeyboard}
        />}
        <button
          type="button"
          className={styles.toggle}
          aria-label={collapsed ? 'Развернуть панель' : 'Свернуть панель'}
          aria-expanded={!collapsed}
          onClick={togglePanel}
        >
          <span className={styles.toggleIcon} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
