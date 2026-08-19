import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from './Button';
import { Modal } from './Modal';

const meta = {
  title: 'UI Kit/Modal',
  component: Modal,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    onClose: fn(),
    title: 'Leave the quiz?',
    description: 'Your progress in this run will be lost.',
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CenterDialog: Story = {
  args: {
    hideCloseButton: true,
    children: (
      <div className="flex gap-3 w-full">
        <Button variant="secondary" fullWidth>Keep Going</Button>
        <Button variant="danger" fullWidth>Leave</Button>
      </div>
    ),
  },
};

export const BottomSheet: Story = {
  args: {
    variant: 'sheet',
    title: 'Study Goal',
    description: 'Pick your daily XP goal',
    children: (
      <div className="space-y-3">
        {['Casual — 20 XP', 'Regular — 50 XP', 'Serious — 100 XP'].map((tier) => (
          <div key={tier} className="w-full p-4 rounded-3xl border-2 border-line-soft bg-white dark:bg-slate-900 font-black text-sm">
            {tier}
          </div>
        ))}
      </div>
    ),
  },
};
