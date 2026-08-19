import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { vocabulary } from '../../data/kurmanji';
import type { Language } from '../../models/user';
import { WordConnectGame } from './WordConnectGame';

const toLanguage = (value: string): Language =>
  value === 'ar' ? 'ar' : value === 'ku' ? 'ku' : 'en';

/** Reproduces the in-app arcade frame: dark canvas, centered mobile column. */
const withArcadeFrame: Decorator = (Story) => (
  <div className="h-screen w-screen bg-slate-950 flex justify-center">
    <div className="w-full max-w-md h-full relative flex flex-col overflow-hidden">
      <Story />
    </div>
  </div>
);

const meta = {
  title: 'Mini-Games/Word Connect',
  component: WordConnectGame,
  parameters: { layout: 'fullscreen' },
  decorators: [withArcadeFrame],
  args: {
    vocabulary: vocabulary.slice(0, 30),
    onWin: fn(),
    onClose: fn(),
    language: 'en',
  },
} satisfies Meta<typeof WordConnectGame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playable: Story = {
  render: (args, { globals }) => (
    <WordConnectGame {...args} language={toLanguage(String(globals.locale))} />
  ),
};
