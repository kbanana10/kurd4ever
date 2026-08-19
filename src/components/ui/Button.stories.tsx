import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';

const meta = {
  title: 'UI Kit/Button',
  component: Button,
  args: { children: 'Start Playing', onClick: fn() },
  parameters: { backgrounds: { default: 'ivory' } },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 items-start p-4">
      <Button variant="primary">Primary — Sun Gold pill</Button>
      <Button variant="secondary">Secondary — quiet surface</Button>
      <Button variant="outline">Outline — brand border</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="success">Success</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3 items-start p-4">
      <Button size="sm">Small — 44px floor</Button>
      <Button size="md">Medium — 50px</Button>
      <Button size="lg">Large — 58px</Button>
      <Button size="md" leadingIcon={<Sparkles className="w-4 h-4" />}>With icon</Button>
      <Button size="md" loading>Loading</Button>
      <Button size="md" fullWidth>Full width</Button>
    </div>
  ),
};
