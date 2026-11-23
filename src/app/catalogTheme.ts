import { useEffect, useState } from 'react';

type CatalogTheme = 'light' | 'dark';
const storageKey = 'data-catalog.theme';

function applyTheme(theme: CatalogTheme) {
  document.documentElement.dataset.catalogTheme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function useCatalogTheme() {
  const [theme, setTheme] = useState<CatalogTheme>(() =>
    document.documentElement.dataset.catalogTheme === 'light' ? 'light' : 'dark',
  );

  useEffect(() => {
    function synchronize(event: StorageEvent) {
      try {
        if (event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      if (event.key !== storageKey && event.key !== null) return;
      const next = event.newValue === 'light' ? 'light' : 'dark';
      applyTheme(next);
      setTheme(next);
    }
    window.addEventListener('storage', synchronize);
    return () => window.removeEventListener('storage', synchronize);
  }, []);

  function toggle() {
    const next = document.documentElement.dataset.catalogTheme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch { /* The theme remains active on this page without storage. */ }
  }

  return { theme, toggle };
}
