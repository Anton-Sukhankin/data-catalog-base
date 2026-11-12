import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { DropdownItem } from '../../components/DropdownItem/DropdownItem';
import { SelectionCheck } from '../../components/DropdownItem/SelectionCheck';
import type { AssistantMode } from './assistantChats';
import s from './AiAssistant.module.css';

const modes = [
  { id: 'assistant', label: 'Ассистент', description: 'Вопросы о данных каталога' },
  { id: 'solution', label: 'Подобрать решение', description: 'Поиск решения под вашу задачу' },
] as const;

export function AssistantModePicker({ value, onChange }: { value: AssistantMode; onChange: (value: AssistantMode) => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const selected = modes.find(mode => mode.id === value)!;

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function focusOption(index: number) {
    list.current?.querySelectorAll<HTMLElement>('[role="option"]')[index]?.focus();
  }

  function onTriggerKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      close();
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    setOpen(true);
    requestAnimationFrame(() => focusOption(modes.findIndex(mode => mode.id === value)));
  }

  function onListKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    const options = Array.from(list.current?.querySelectorAll('[role="option"]') ?? []);
    const index = options.indexOf(event.target as HTMLElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? modes.length - 1 :
      event.key === 'ArrowDown' ? (index + 1) % modes.length :
      event.key === 'ArrowUp' ? (index + modes.length - 1) % modes.length : undefined;
    if (next === undefined) return;
    event.preventDefault();
    focusOption(next);
  }

  return <div className={s.modePicker}>
    <button ref={trigger} className={s.modeTrigger} type="button" aria-haspopup="listbox"
      aria-expanded={open} aria-controls={id} onClick={() => setOpen(previous => !previous)}
      onKeyDown={onTriggerKey}>
      <span>{selected.label}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    <div id={id} ref={list} className={s.modeList} role="listbox" aria-label="Режим AI-ассистента"
      data-open={open} inert={!open} onKeyDown={onListKey}>
      {modes.map(mode => <DropdownItem key={mode.id} className={s.modeOption} role="option"
        aria-label={mode.label} aria-selected={mode.id === value} onClick={() => { onChange(mode.id); close(); }}>
        <SelectionCheck selected={mode.id === value} />
        <span><strong>{mode.label}</strong><small>{mode.description}</small></span>
      </DropdownItem>)}
    </div>
  </div>;
}
