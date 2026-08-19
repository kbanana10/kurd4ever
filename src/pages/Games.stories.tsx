import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '../store/AuthContext';
import { Games } from './Games';

/**
 * The Spelling Scrambler lives inline in the Games page (not a standalone
 * component), so its story renders the real page inside the real providers
 * and drives the menu like a user. Guest session is seeded before mount.
 */
function seedGuestSession() {
  try {
    localStorage.setItem('kurdish_quest_lang', 'en');
    localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'Storybook Tester' }));
    const now = Date.now();
    localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({
      xp: 480, level: 4, gems: 240, streak: 6, streakFreezes: 1,
      lastActive: now, lastActiveDate: new Date().toISOString().slice(0, 10),
      createdAt: now, updatedAt: now, wordsLearned: 42,
      recentSearches: [], favorites: [], completedLessons: ['a1_family'],
      unlockedLevels: ['A1'], badges: [], gameScores: {}, wrongAnswersHistory: [],
      reviewDeck: {}, weakCategories: {}, strongCategories: {},
      sessionsCount: 9, totalStudyTime: 3600, isOnboarded: true, dailyGoalXp: 50,
      completedTours: ['tour_home_v1', 'tour_roadmap_v1', 'tour_reward_claimed_v1'],
    }));
  } catch {
    // Storage unavailable — the page will fall back to a fresh guest.
  }
}

const withAppProviders: Decorator = (Story) => {
  seedGuestSession();
  return (
    <MemoryRouter initialEntries={['/games']}>
      <AuthProvider>
        <div className="h-screen w-screen bg-slate-950 flex justify-center">
          <div className="w-full max-w-md h-full relative flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <Story />
          </div>
        </div>
      </AuthProvider>
    </MemoryRouter>
  );
};

const meta = {
  title: 'Mini-Games/Games Page',
  component: Games,
  parameters: { layout: 'fullscreen' },
  decorators: [withAppProviders],
} satisfies Meta<typeof Games>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ArcadeMenu: Story = {};

export const SpellingScrambler: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = await canvas.findByText(/Spelling Scrambler/i, undefined, { timeout: 15000 });
    await userEvent.click(card);
    await waitFor(async () => {
      await canvas.findByText(/SPELL IT IN KURDISH/i);
    }, { timeout: 15000 });
  },
};
