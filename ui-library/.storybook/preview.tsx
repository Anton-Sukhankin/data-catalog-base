import type { Preview } from '@storybook/react-vite';
import { useLayoutEffect, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import '../src/styles/theme.css';

function DocumentTheme({ dark, children }: { dark: boolean; children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute('data-catalog-theme');
    root.dataset.catalogTheme = dark ? 'dark' : 'light';
    return () => {
      if (previous === null) root.removeAttribute('data-catalog-theme');
      else root.dataset.catalogTheme = previous;
    };
  }, [dark]);
  return <div className="catalog-ui">{children}</div>;
}

const preview: Preview = {
  parameters: { options: { storySort: { order: ['Components', 'Screens'] } } },
  initialGlobals: { catalogTheme: 'light' },
  globalTypes: {
    catalogTheme: {
      description: 'Тема Каталога данных',
      toolbar: {
        title: 'Тема',
        icon: 'mirror',
        dynamicTitle: true,
        items: [{ value: 'light', title: 'Светлая' }, { value: 'dark', title: 'Тёмная' }],
      },
    },
  },
  decorators: [(Story, context) => (
    <MemoryRouter><DocumentTheme dark={context.globals.catalogTheme === 'dark'}><Story /></DocumentTheme></MemoryRouter>
  )],
};

export default preview;
