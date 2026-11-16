import { useState, type ReactNode } from 'react';
import { LogOut, Shield, UserRound } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { DropdownItem } from '@data-catalog/ui/source/components/DropdownItem/DropdownItem';
import styles from './Header.module.css';

interface HeaderProps {
  productName: string;
  brandMarkSrc: string;
  avatarSrc: string;
  search: ReactNode;
}

const profileItems = [
  { label: 'Профиль', Icon: UserRound },
  { label: 'Админка', Icon: Shield },
  { label: 'Выйти', Icon: LogOut },
];

export function Header({ productName, brandMarkSrc, avatarSrc, search }: HeaderProps) {
  const [keyboard, setKeyboard] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img src={brandMarkSrc} width="20" height="20" alt="" aria-hidden="true" />
        <span>{productName}</span>
      </div>
      <div className={styles.searchSlot}>{search}</div>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button className={styles.profile} type="button" aria-label="Профиль пользователя"
            onPointerDown={() => setKeyboard(false)} onKeyDown={() => setKeyboard(true)}>
            <img src={avatarSrc} width="32" height="32" alt="Фото пользователя" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={styles.profileMenu} align="end" sideOffset={8} collisionPadding={8}
            data-dropdown-surface="true" data-keyboard={keyboard}
            onPointerMove={() => setKeyboard(false)} onKeyDown={() => setKeyboard(true)}>
            {profileItems.map(({ label, Icon }) => (
              <DropdownMenu.Item key={label} asChild onSelect={event => event.preventDefault()}>
                <DropdownItem className={styles.profileItem}>
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </DropdownItem>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}
