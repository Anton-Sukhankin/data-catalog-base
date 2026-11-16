import type { StorybookConfig } from '@storybook/react-vite';

export default {
  framework: { name: '@storybook/react-vite', options: { builder: { viteConfigPath: '.storybook/vite.config.ts' } } },
  stories: ['../stories/**/*.stories.tsx'],
  core: { disableTelemetry: true },
} satisfies StorybookConfig;
