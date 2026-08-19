import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Flame, Star } from 'lucide-react';
import { Progress } from './Progress';
import { Spinner } from './Spinner';
import { StatPill } from './StatPill';
import { Switch } from './Switch';
import { ErrorState } from './ErrorState';

/**
 * Small primitives grouped in one gallery: Progress, Spinner, StatPill,
 * Switch and ErrorState — every remaining member of the ui/ barrel.
 */
const meta = {
  title: 'UI Kit/Small Primitives',
  parameters: { backgrounds: { default: 'ivory' } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProgressBars: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 w-80">
      <Progress value={30} size="sm" label="30 of 100 XP" />
      <Progress value={65} size="md" label="65 of 100 XP" />
      <Progress value={100} size="lg" label="Level complete" />
    </div>
  ),
};

export const Spinners: Story = {
  render: () => (
    <div className="flex items-end gap-6 p-4">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" showLabel label="Loading…" />
    </div>
  ),
};

export const StatPills: Story = {
  render: () => (
    <div className="flex gap-3 p-4">
      <StatPill icon={<Flame className="w-4 h-4 text-orange-500 fill-orange-500" />} label="Streak" value={6} />
      <StatPill icon={<span>💎</span>} label="Gems" value={240} />
      <StatPill icon={<Star className="w-4 h-4 text-[#FFB300] fill-[#FFB300]" />} label="XP" value={480} />
    </div>
  ),
};

function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center gap-3 p-4">
      <Switch checked={on} onCheckedChange={setOn} label="Daily reminders" />
      <span className="text-sm font-bold text-ink">{on ? 'On' : 'Off'}</span>
    </div>
  );
}

export const SwitchControl: Story = { render: () => <SwitchDemo /> };

export const ErrorStateCard: Story = {
  render: () => (
    <div className="w-80 p-4">
      <ErrorState
        title="Something went wrong"
        description="We could not load your profile. Check your connection and try again."
        retryLabel="Try again"
        onRetry={() => undefined}
      />
    </div>
  ),
};
