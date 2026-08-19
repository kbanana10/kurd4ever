import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Heart, Pause } from 'lucide-react';
import { GameHeader } from './GameHeader';

const meta = {
  title: 'Mini-Games/GameHeader',
  component: GameHeader,
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Word Connect',
    onExit: fn(),
    exitLabel: 'Exit game',
  },
} satisfies Meta<typeof GameHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LightWithScore: Story = {
  args: {
    stat: { label: 'Level', value: '2/5' },
  },
  render: (args) => (
    <div className="max-w-md mx-auto bg-slate-50 p-3">
      <GameHeader {...args} />
    </div>
  ),
};

export const LightWithTimeAndScore: Story = {
  args: {
    title: 'Word Matching',
    indicator: (
      <span className="flex items-center gap-1 rounded-full px-2.5 min-h-[36px] bg-white border border-line-soft shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-xs font-black tabular-nums text-ink">
        <span dir="ltr">00:37</span>
      </span>
    ),
    stat: { label: 'XP', value: 40 },
  },
  render: (args) => (
    <div className="max-w-md mx-auto bg-slate-50 p-3">
      <GameHeader {...args} />
    </div>
  ),
};

export const DarkArenaWithLives: Story = {
  args: {
    title: 'ZOMBIES',
    tone: 'dark',
    indicator: (
      <span className="flex items-center gap-0.5">
        {[1, 2, 3].map((h) => (
          <Heart key={h} className={`w-4 h-4 ${h <= 2 ? 'text-red-500 fill-red-500' : 'text-slate-800 fill-slate-800'}`} />
        ))}
      </span>
    ),
    stat: { label: 'Score', value: 120 },
    action: (
      <button
        type="button"
        aria-label="Pause"
        className="min-w-[44px] min-h-[44px] shrink-0 rounded-full border bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
      >
        <Pause className="w-4 h-4 fill-current" />
      </button>
    ),
  },
  render: (args) => (
    <div className="max-w-md mx-auto bg-[#0B0E1D] p-3">
      <GameHeader {...args} />
    </div>
  ),
};
