import { KeyRound } from 'lucide-react';
import s from './SourceActions.module.css';

export function SourceActions({ onNotice, iconsOnly = false }: { onNotice: (message: string) => void; iconsOnly?: boolean }) {
  const buttonClass = iconsOnly ? `${s.button} ${s.circle}` : s.button;
  const downloadLabel = 'Скачать метаданные';
  const accessLabel = 'Получить доступ';
  return <>
    <button type="button" className={buttonClass} aria-label={iconsOnly ? downloadLabel : undefined}
      title={iconsOnly ? downloadLabel : undefined} onClick={() => onNotice('Выгрузка метаданных не подключена. Файл не создан.')}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!iconsOnly && downloadLabel}
    </button>
    <button type="button" className={`${buttonClass} ${s.access}`} aria-label={iconsOnly ? accessLabel : undefined}
      title={iconsOnly ? accessLabel : undefined} onClick={() => onNotice('Получение доступа не подключено. Заявка не отправлена.')}>
      {iconsOnly ? <KeyRound size={16} aria-hidden="true" /> : accessLabel}
    </button>
  </>;
}

export function SourceNotice({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className={s.notice} role="status">
    <p>{message}</p>
    <button type="button" onClick={onClose} aria-label="Закрыть уведомление">×</button>
  </div>;
}
