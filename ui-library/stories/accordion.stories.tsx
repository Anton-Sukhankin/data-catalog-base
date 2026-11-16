import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles } from 'lucide-react';
import { Accordion } from '../src';

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  args: { title: 'Об отчёте', description: 'Назначение и содержание', children: 'Показывает динамику по выбранному периоду.' },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Open: Story = { name: 'Раскрыт' };
export const Closed: Story = { name: 'Свёрнут', args: { defaultOpen: false } };
export const WithIndicators: Story = { name: 'Счётчик и индикатор', args: { count: 8, icon: <Sparkles size={16} /> } };
export const Static: Story = { name: 'Статичная секция', args: { collapsible: false, bodyInset: 'flush' } };
export const Metric: Story = { name: 'Вариант метрики', args: { variant: 'metric', chevronSize: 40 } };
