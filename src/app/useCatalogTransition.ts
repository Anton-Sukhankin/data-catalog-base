import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { cancelCatalogTransition } from '../components/catalogTransition';

export function useCatalogTransition(main: RefObject<HTMLElement | null>, screen: string, view: string | null, tab: string | null) {
  const previous = useRef({ screen, view, tab });

  useEffect(() => {
    window.addEventListener('popstate', cancelCatalogTransition);
    return () => window.removeEventListener('popstate', cancelCatalogTransition);
  }, []);

  useLayoutEffect(() => {
    const screenChanged = previous.current.screen !== screen;
    const viewChanged = previous.current.view !== view;
    const tabChanged = previous.current.tab !== tab;
    previous.current = { screen, view, tab };
    if ((!screenChanged && !viewChanged && !tabChanged) || document.documentElement.dataset.catalogTransition
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const surface = screenChanged ? main.current
      : main.current?.querySelector(tabChanged ? '[data-detail-tab-content]' : '[data-catalog-view-results]');
    const animation = surface?.animate?.([{ opacity: 0.35 }, { opacity: 1 }], {
      duration: screenChanged ? 240 : 200,
      easing: 'ease-out',
    });
    return () => animation?.cancel();
  }, [main, screen, view, tab]);
}
