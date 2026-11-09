import type { ReactNode } from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  productName: string;
  brandMarkSrc: string;
  avatarSrc: string;
  search: ReactNode;
}

export function Header({ productName, brandMarkSrc, avatarSrc, search }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img src={brandMarkSrc} width="20" height="20" alt="" aria-hidden="true" />
        <span>{productName}</span>
      </div>
      <div className={styles.searchSlot}>{search}</div>
      <div className={styles.profile} aria-label="Профиль пользователя">
        <img src={avatarSrc} width="32" height="32" alt="Фото пользователя" />
      </div>
    </header>
  );
}
