import { DescriptionText } from '../DescriptionText/DescriptionText';
import s from './DetailInformation.module.css';

export function DetailInformationHeading({ title = 'Сведения', description }: { title?: string; description: string }) {
  return <h2 className={s.heading}>{title}<small>{description}</small></h2>;
}

export function DetailInformationPerson({ name, description, role, avatar }: {
  name: string;
  description?: string;
  role: string;
  avatar?: string;
}) {
  return <div className={s.person}>
    <img src={avatar ?? '/images/favorites/avatar-placeholder.svg'} width="32" height="32" alt="" />
    <div><span>{name}</span>{description && <small><DescriptionText text={description} /></small>}</div>
    <span className={s.role}>{role}</span>
  </div>;
}
