import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'UI Kit/Badge',
  component: Badge,
  args: { children: 'B1' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <div className="flex gap-3 items-center p-4 flex-wrap">
      <Badge tone="primary">Primary</Badge>
      <Badge tone="success">Success</Badge>
      <Badge tone="warning">Warning</Badge>
      <Badge tone="danger">Danger</Badge>
      <Badge tone="neutral">Neutral</Badge>
    </div>
  ),
};
