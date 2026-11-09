import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { RoundIconButton } from '../../components/RoundIconButton/RoundIconButton';
import type { QuestionDraft } from '../../data/questions';
import s from './AskQuestionDialog.module.css';

export function AskQuestionDialog({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (draft: QuestionDraft) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const subjectInput = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [subjectError, setSubjectError] = useState(false);
  const [messageError, setMessageError] = useState(false);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
    subjectInput.current?.focus();
  }, []);

  function close() {
    dialog.current?.close();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog.current?.open) return;
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    setSubjectError(!cleanSubject);
    setMessageError(!cleanMessage);
    if (!cleanSubject || !cleanMessage) {
      (!cleanSubject ? subjectInput : messageInput).current?.focus();
      return;
    }
    close();
    onSubmit({ subject: cleanSubject, message: cleanMessage });
  }

  return <dialog className={s.dialog} ref={dialog} aria-labelledby={`${id}-title`}
    aria-describedby={`${id}-hint`} onClose={onClose}>
    <header className={s.header}>
      <div>
        <h2 id={`${id}-title`}>Задать вопрос</h2>
        <p id={`${id}-hint`}>Укажите тему и опишите вопрос.</p>
      </div>
      <RoundIconButton icon="close" aria-label="Закрыть форму вопроса" onClick={close} />
    </header>
    <form className={s.form} noValidate onSubmit={submit}>
      <div className={s.field}>
        <label htmlFor={`${id}-subject`}>Тема</label>
        <input id={`${id}-subject`} ref={subjectInput} required value={subject} autoComplete="off"
          placeholder="Кратко обозначьте тему" onChange={event => {
            setSubject(event.target.value);
            if (event.target.value.trim()) setSubjectError(false);
          }} aria-invalid={subjectError || undefined}
          aria-describedby={subjectError ? `${id}-subject-error` : undefined} />
        {subjectError && <p id={`${id}-subject-error`} className={s.error} role="alert">Поле «Тема» обязательно для заполнения.</p>}
      </div>
      <div className={s.field}>
        <label htmlFor={`${id}-message`}>Ваш вопрос</label>
        <textarea id={`${id}-message`} ref={messageInput} required value={message} placeholder="Опишите ваш вопрос"
          onChange={event => {
            setMessage(event.target.value);
            if (event.target.value.trim()) setMessageError(false);
          }}
          aria-invalid={messageError || undefined}
          aria-describedby={messageError ? `${id}-message-error` : undefined} />
        {messageError && <p id={`${id}-message-error`} className={s.error} role="alert">Введите текст вопроса, чтобы отправить его.</p>}
      </div>
      <footer className={s.actions}>
        <button type="button" className={s.button} onClick={close}>Отмена</button>
        <button type="submit" className={`${s.button} ${s.submit}`}>Отправить вопрос</button>
      </footer>
    </form>
  </dialog>;
}
