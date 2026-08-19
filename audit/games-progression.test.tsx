/**
 * games-progression.test.tsx
 *
 * Regression tests for the DOUBLE-STEP bug in the mini-games:
 * - Word Matching: "Next Round" clicked twice (incl. during the overlay's
 *   exit animation) used to advance the round by +2.
 * - Word Connect: the manual "Next Level" button raced the untracked 900ms
 *   auto-advance timer — one solved word could advance the level by +2.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WordMatchingGame } from '../src/components/games/WordMatchingGame';
import { WordConnectGame } from '../src/components/games/WordConnectGame';
import { Word } from '../src/data/kurmanji';
import { playCompleteSound } from '../src/features/audio/hooks/useAudio';

vi.mock('../src/features/audio/hooks/useAudio', () => ({
  stopAllActiveAudio: vi.fn(),
  playSuccessSound: vi.fn(),
  playFailureSound: vi.fn(),
  playCompleteSound: vi.fn(),
  playZombieDamageSound: vi.fn(),
}));

const mkWord = (id: string, ku: string, en: string, ar: string): Word => ({
  id, ku, en, ar, emoji: '🟡', audio: `/audio/${id}.mp3`,
  category: 'test', categoryId: 'test', difficulty: 'easy',
} as Word);

const VOCAB: Word[] = [
  mkWord('w1', 'Sor', 'Red', 'أحمر'),
  mkWord('w2', 'Şev', 'Night', 'ليل'),
  mkWord('w3', 'Sibe', 'Morning', 'صباح'),
  mkWord('w4', 'Hêk', 'Egg', 'بيضة'),
  mkWord('w5', 'Av', 'Water', 'ماء'),
  mkWord('w6', 'Nan', 'Bread', 'خبز'),
  mkWord('w7', 'Roj', 'Day', 'يوم'),
  mkWord('w8', 'Dar', 'Tree', 'شجرة'),
];

describe('Word Matching — single-round advance guarantee', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  function completeRound() {
    // Round 1 board shows 4 ku/ar pairs; click each ku then its ar meaning.
    // Buttons render the word text, so pair them via VOCAB lookups.
    for (const w of VOCAB) {
      const kuBtns = screen.queryAllByText(w.ku);
      const arBtns = screen.queryAllByText(w.ar);
      if (kuBtns.length && arBtns.length) {
        fireEvent.click(kuBtns[0]);
        fireEvent.click(arBtns[0]);
        act(() => { vi.advanceTimersByTime(50); });
      }
    }
  }

  it('double-clicking "Next Round" advances exactly one round', () => {
    const onWin = vi.fn();
    render(
      <WordMatchingGame vocabulary={VOCAB} language="en" onWin={onWin} onClose={vi.fn()} />
    );

    completeRound();

    // Victory overlay appears once
    expect(screen.getByText('Brilliant Connection!')).toBeTruthy();
    expect(onWin).toHaveBeenCalledTimes(1);

    // Rapid double click on Next Round (2nd click during exit animation)
    const nextBtn = screen.getByText('Next Round');
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    act(() => { vi.advanceTimersByTime(1000); });

    // Round 2 gives 5 lives (round 3 would give 4) — proves round === 2
    expect(document.querySelector('[aria-valuemax="5"]')).toBeTruthy();
    expect(document.querySelector('[aria-valuemax="4"]')).toBeNull();

    // THE POPUP MUST NOT RE-APPEAR after advancing (double-popup bug):
    // under jsdom, AnimatePresence keeps an exit-animating clone around, so
    // the robust proof is that victory was NOT declared a second time —
    // XP awarded once, completion sound played once.
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(vi.mocked(playCompleteSound)).toHaveBeenCalledTimes(1);
  });

  it('Hint button matches a real pair (was silently broken)', () => {
    render(
      <WordMatchingGame vocabulary={VOCAB} language="en" onWin={vi.fn()} onClose={vi.fn()} />
    );
    const before = document.querySelectorAll('[class*="pointer-events-none"]').length;
    fireEvent.click(screen.getByText('Hint'));
    act(() => { vi.advanceTimersByTime(50); });
    // one ku + one ar item flip to matched state → progress shows 1 / 4
    expect(screen.getByText(/1\s*\/\s*4/)).toBeTruthy();
    expect(before).toBeGreaterThanOrEqual(0);
  });
});

describe('Word Connect — single-level advance guarantee', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  function solveCurrentWord(target: string) {
    // Drag simulation: mousedown on first letter, mouseenter the rest,
    // then release on window.
    const pad = document.querySelector('[data-letter-index]')?.parentElement;
    expect(pad).toBeTruthy();
    const buttons = [...document.querySelectorAll('[data-letter-index]')] as HTMLElement[];
    const byChar = (ch: string, used: Set<HTMLElement>) =>
      buttons.find(b => (b.textContent || '').trim() === ch && !used.has(b))!;

    const used = new Set<HTMLElement>();
    const first = byChar(target[0], used);
    used.add(first);
    fireEvent.mouseDown(first);
    for (let i = 1; i < target.length; i++) {
      const el = byChar(target[i], used);
      used.add(el);
      fireEvent.mouseOver(el, { relatedTarget: document.body });
    }
    fireEvent.mouseUp(window);
  }

  it('clicking "Next Level" while the 900ms auto-advance is pending → +1 level, never +2', () => {
    const onWin = vi.fn();
    render(
      <WordConnectGame vocabulary={VOCAB} language="en" onWin={onWin} onClose={vi.fn()} />
    );

    expect(screen.getByText('1/5')).toBeTruthy(); // GameHeader stat value (label 'Level' is a separate span)
    // Level 1 loads pool[0]: filtered pool ordering follows VOCAB → 'SOR'
    solveCurrentWord('SOR');

    // success overlay + XP awarded once
    expect(screen.getByText('Awesome Match!')).toBeTruthy();
    expect(onWin).toHaveBeenCalledTimes(1);

    // Manual click INSIDE the 900ms auto-advance window + double-click
    const next = screen.getByText('Next Level');
    fireEvent.click(next);
    fireEvent.click(next);

    // Flush the (cancelled) auto-advance timer and any animations
    act(() => { vi.advanceTimersByTime(3000); });

    expect(screen.getByText('2/5')).toBeTruthy();
    expect(screen.queryByText('Level 3/5')).toBeNull();
  });

  it('leaving the auto-advance alone also moves exactly +1', () => {
    render(
      <WordConnectGame vocabulary={VOCAB} language="en" onWin={vi.fn()} onClose={vi.fn()} />
    );
    solveCurrentWord('SOR');
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText('2/5')).toBeTruthy();
  });
});
