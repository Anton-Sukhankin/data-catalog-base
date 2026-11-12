import { flushSync } from 'react-dom';

export type CatalogTransition = 'screen' | 'view' | 'tab';
let current: ViewTransition | undefined;

export function cancelCatalogTransition() {
  current?.skipTransition();
  current = undefined;
  delete document.documentElement.dataset.catalogTransition;
}

export function transitionCatalog(update: () => void, kind: CatalogTransition = 'screen', enabled = true) {
  const selector = kind === 'screen' ? '[data-catalog-screen]' : '[data-catalog-view-results]';
  cancelCatalogTransition();
  const root = document.documentElement;
  if (kind === 'tab' || !enabled || !document.startViewTransition || !document.querySelector(selector)
    || document.querySelector('[data-catalog-persistent-overlay]')
    || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Keep live overlays above the catalog. The workspace can animate its content in place.
    update();
    return;
  }

  root.dataset.catalogTransition = kind;
  const transition = document.startViewTransition(() => {
    // A skipped transition can still run its callback. Only apply the latest intent.
    if (current === transition) flushSync(update);
  });
  current = transition;

  function clear() {
    if (current !== transition) return;
    current = undefined;
    delete root.dataset.catalogTransition;
  }
  void transition.ready.catch(() => {});
  void transition.finished.then(clear, clear);
}
