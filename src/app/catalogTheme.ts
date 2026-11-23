import { useEffect, useState } from 'react';

type CatalogTheme = 'light' | 'dark';
const storageKey = 'data-catalog.theme';

function applyTheme(theme: CatalogTheme) {
  document.documentElement.dataset.catalogTheme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function useCatalogTheme() {
  const enabled = document.documentElement.dataset.catalogThemePilot === 'true';
  const [theme, setTheme] = useState<CatalogTheme>(() =>
    document.documentElement.dataset.catalogTheme === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    if (!enabled) return;
    function synchronize(event: StorageEvent) {
      try {
        if (event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      if (event.key !== storageKey && event.key !== null) return;
      const next = event.newValue === 'dark' ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    }
    window.addEventListener('storage', synchronize);
    return () => window.removeEventListener('storage', synchronize);
  }, [enabled]);

  function toggle() {
    const next = document.documentElement.dataset.catalogTheme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch { /* The theme remains active on this page without storage. */ }
  }

  return { enabled, theme, toggle };
}
