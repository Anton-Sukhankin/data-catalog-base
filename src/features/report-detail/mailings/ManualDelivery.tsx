import { useId, type ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { Accordion } from '../../../components/Accordion/Accordion';
import { RecipientSelect } from './RecipientSelect';
import {
  attachmentFields, deliveryChannels, initialDelivery, isDeliveryChanged, sheetDescription, sheetModes, summarizeDelivery,
  type AttachmentField, type ChannelDraft, type DeliveryChannel, type ManualDeliveryData, type ManualDeliveryDraft,
} from './deliveryModel';
import s from './ManualDelivery.module.css';

interface Props {
  data: ManualDeliveryData;
  draft?: ManualDeliveryDraft;
  onChange: (draft: ManualDeliveryDraft) => void;
  onSend: () => void;
}

const plural = new Intl.PluralRules('ru');
const channelWords = { one: 'канал', few: 'канала', many: 'каналов' };
const sheetWords = { one: 'лист', few: 'листа', many: 'листов' };
const attachmentKeys = Object.keys(attachmentFields) as AttachmentField[];

function quantity(value: number, words: typeof channelWords) {
  return `${value} ${words[plural.select(value) as keyof typeof words] ?? words.many}`;
}

function Help({ text }: { text: string }) {
  return <span className={s.help} title={text}><CircleHelp size={16} aria-hidden="true" /></span>;
}

function Switch({ checked, onChange, name, children }: {
  checked: boolean; onChange: (checked: boolean) => void; name?: string; children: ReactNode;
}) {
  return <label className={s.switch}>
    <input type="checkbox" role="switch" aria-label={name} checked={checked} onChange={event => onChange(event.target.checked)} />
    {children}
  </label>;
}

function AttachmentOptions({ value, onChange }: { value: ChannelDraft; onChange: (change: Partial<ChannelDraft>) => void }) {
  const id = useId();
  return <div className={s.attachment}>
    {attachmentKeys.map(key => {
      const { label, options } = attachmentFields[key];
      return <fieldset key={key} className={s.attachmentGroup}>
        <legend>{label}</legend>
        <div className={s.radioOptions}>
          {options.map(option => <label key={option} className={s.choice}>
            <input className={s.radio} type="radio" name={`${id}-${key}`} value={option} checked={value[key] === option}
              onChange={() => onChange({ [key]: option })} />{option}
          </label>)}
        </div>
      </fieldset>;
    })}
    <label className={s.choice}><input type="checkbox" className={s.checkbox} checked={value.archive}
      onChange={event => onChange({ archive: event.target.checked })} />Архивировать</label>
  </div>;
}

export function ManualDelivery({ data, draft: current, onChange, onSend }: Props) {
  const initial = initialDelivery(data);
  const draft = current ?? initial;
  const summary = summarizeDelivery(data, draft);
  const count = draft.sheets.length;
  const blocked = count === 0 ? 'Выберите хотя бы один лист.' : summary.length === 0 ? 'Укажите получателя хотя бы для одного канала.' : undefined;
  const summaryLabel = `${quantity(summary.length, channelWords)} · ${quantity(count, sheetWords)}`;
  const summaryDetail = summary.join(' · ');

  function updateChannel(id: DeliveryChannel, change: Partial<ChannelDraft>) {
    onChange({ ...draft, channels: { ...draft.channels, [id]: { ...draft.channels[id], ...change } } });
  }

  function toggleSheet(id: string, selected: boolean) {
    const sheets = selected ? [...draft.sheets, id] : draft.sheets.filter(sheet => sheet !== id);
    onChange({ ...draft, sheets });
  }

  return <>
    <div className={s.deliveryBody} data-manual-delivery>
      <section className={s.channels} aria-label="Каналы доставки">
        <header className={s.sectionHeading}>
          <h2>Каналы доставки</h2>
          <p>Укажите получателей и параметры файла для каждого канала.</p>
        </header>
        <div className={s.channelList}>
          {deliveryChannels.map(({ id, title, fields }) => <div key={id} className={s.channel} data-delivery-channel={id}>
            <Accordion title={title} inlineMetadata={<Help text={`Получатели и параметры файла: ${title}`} />}
              bodyInset="flush" action={<Switch checked={draft.channels[id].self} name={`${title} — себе`}
                onChange={self => updateChannel(id, { self })}>Себе</Switch>}>
              <div className={s.recipients}>
                {fields.map(field => <RecipientSelect key={field} field={field} options={data.recipients[field]} selected={draft.recipients[field]}
                  onChange={values => onChange({ ...draft, recipients: { ...draft.recipients, [field]: values } })} />)}
              </div>
              <AttachmentOptions value={draft.channels[id]} onChange={change => updateChannel(id, change)} />
            </Accordion>
          </div>)}
        </div>
      </section>
      <section className={s.sheets} aria-label="Листы отчёта">
        <div className={s.sheetControls}>
          <div className={s.sheetIntro}>
            <h2>Листы отчёта <Help text={sheetDescription} /></h2>
            <p>{sheetDescription}</p>
          </div>
          <div className={s.sheetModes} role="group" aria-label="Режимы фильтрации листов">
            {sheetModes.map(({ id, label }) => <Switch key={id} checked={draft.modes[id]}
              onChange={checked => onChange({ ...draft, modes: { ...draft.modes, [id]: checked } })}>{label}</Switch>)}
          </div>
        </div>
        <div className={s.sheetList}>
          {data.sheets.map(({ id, title }) => <div key={id} className={s.sheet} data-delivery-sheet>
            <Accordion title={title} defaultOpen={false} leadingAction={<input className={s.checkbox} type="checkbox"
              aria-label={`Включить лист «${title}» в отправку`} checked={draft.sheets.includes(id)}
              onChange={event => toggleSheet(id, event.target.checked)} />}>
              <p>Параметры фильтрации этого листа недоступны в прототипе.</p>
            </Accordion>
          </div>)}
        </div>
      </section>
    </div>
    <footer className={s.deliveryFooter} role="region" aria-label="Итог ручной отправки" data-manual-delivery-footer>
      <div className={s.summary} aria-live="polite">
        <strong>{summaryLabel}</strong>
        <span title={blocked ?? summaryDetail}>{blocked ?? summaryDetail}</span>
      </div>
      <div className={s.footerActions}>
        <button type="button" className={s.reset} disabled={!isDeliveryChanged(initial, draft)} onClick={() => onChange(initial)}>Сбросить</button>
        <button type="button" className={s.send} disabled={Boolean(blocked)} onClick={onSend}>Отправить</button>
      </div>
    </footer>
  </>;
}
