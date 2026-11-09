import s from './QuestionSentNotice.module.css';

export function QuestionSentNotice({ onClose }: { onClose: () => void }) {
  return <div role="status" className={s.notice}>
    <button type="button" aria-label="Закрыть уведомление" onClick={onClose}>×</button>
    <strong>Вопрос отправлен</strong>
    <small>Демонстрация. Серверная доставка не подключена.</small>
  </div>;
}
