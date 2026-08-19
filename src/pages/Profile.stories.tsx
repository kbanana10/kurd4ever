import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '../store/AuthContext';
import { Profile } from './Profile';

/** Established guest session: stats grid, badges, missions and settings all populated. */
function seedGuestSession() {
  try {
    localStorage.setItem('kurdish_quest_lang', 'en');
    localStorage.setItem('kurdish_quest_theme', 'light');
    localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'Storybook Tester' }));
    const now = Date.now();
    localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({
      xp: 480, level: 4, gems: 240, streak: 6, streakFreezes: 1,
      lastActive: now, lastActiveDate: new Date().toISOString().slice(0, 10),
      createdAt: now, updatedAt: now, wordsLearned: 42, quizzesCompleted: 7,
      recentSearches: [], favorites: ['f_mom', 'f_dad'], completedLessons: ['a1_family'],
      unlockedLevels: ['A1', 'A2'], badges: ['first_steps', 'word_collector'],
      gameScores: { word_connect: 120 }, wrongAnswersHistory: [], reviewDeck: {},
      weakCategories: {}, strongCategories: {}, sessionsCount: 9, totalStudyTime: 3600,
      isOnboarded: true, dailyGoalXp: 50, xpToday: 20,
      xpTodayDate: new Date().toISOString().slice(0, 10),
      completedTours: ['tour_home_v1', 'tour_roadmap_v1', 'tour_reward_claimed_v1'],
    }));
  } catch {
    // Storage unavailable — page falls back to a fresh guest.
  }
}

const withAppProviders: Decorator = (Story) => {
  seedGuestSession();
  return (
    <MemoryRouter initialEntries={['/profile']}>
      <AuthProvider>
        <div className="h-screen w-screen bg-surface-2 flex justify-center">
          <div className="w-full max-w-md h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <Story />
          </div>
        </div>
      </AuthProvider>
    </MemoryRouter>
  );
};

const meta = {
  title: 'Pages/Profile',
  component: Profile,
  parameters: { layout: 'fullscreen' },
  decorators: [withAppProviders],
} satisfies Meta<typeof Profile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Progress tab: identity card, quick links, stats grid, missions, badges. */
export const ProgressTab: Story = {};

/** Settings tab: language segmented control, Switch primitives (dark mode,
 *  reminders), guided-tour replay, legal links. */
export const SettingsTab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tab = await canvas.findByText(/^Settings$/i, undefined, { timeout: 15000 });
    await userEvent.click(tab);
    await canvas.findByText(/App Language/i, undefined, { timeout: 15000 });
  },
};
