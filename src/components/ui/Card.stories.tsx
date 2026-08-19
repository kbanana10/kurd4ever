import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta = {
  title: 'UI Kit/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Elevations: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 w-80">
      <Card elevation="flat" padding="md">
        <div className="font-black text-sm">Flat — list rows</div>
        <div className="text-xs text-muted font-semibold mt-1">Subtle 2px ambient shadow.</div>
      </Card>
      <Card elevation="raised" padding="md">
        <div className="font-black text-sm">Raised — primary content</div>
        <div className="text-xs text-muted font-semibold mt-1">The standard app surface (shadow-flat token).</div>
      </Card>
      <Card elevation="outline" padding="md">
        <div className="font-black text-sm">Outline — empty states</div>
        <div className="text-xs text-muted font-semibold mt-1">Dashed border, transparent body.</div>
      </Card>
    </div>
  ),
};
