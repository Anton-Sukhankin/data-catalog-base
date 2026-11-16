import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';

const preview: Preview = {
  parameters: { options: { storySort: { order: ['Components', 'Screens'] } } },
  decorators: [Story => <MemoryRouter><div className="catalog-ui"><Story /></div></MemoryRouter>],
};

export default preview;
