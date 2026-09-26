/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

/**
 * ConceptCard / TriRow — strict layout contract test.
 *
 * The task requires a browser measurement between rows within ±2px. jsdom
 * cannot run a real layout engine, so (as permitted by the task) we assert the
 * *computed layout contract* that produces that alignment, directly on the
 * source grid markup. These are the properties the real browser uses to keep
 * the audio button center and the translation right-edge identical row-to-row:
 *
 *  1. Every row must be `display: grid` with the three-track template
 *     `[1fr_auto_1fr]` and `align-items: center`. The two 1fr tracks make the
 *     `auto` middle track land on the exact row center — for every row equally,
 *     independent of text length — while long text wraps inside its track
 *     (`min-w-0` + `break-words`) instead of pushing the button off-center.
 *  2. Column order and text alignment must be explicit: Kurdish left, audio
 *     centered in the middle track (`justify-self`), translation right-aligned.
 *  3. The row must be forced LTR (`direction: ltr`) so a RTL page (Arabic UI)
 *     cannot flip the columns.
 *
 * The mocks in audit/setup.ts stub AudioContext/canvas; AudioButton renders
 * without those extra mocks (it only calls useAudio → speechSynthesis on click,
 * never on mount, and jsdom lacks speechSynthesis → guarded).
 */

const GRID_TEMPLATE = 'grid-cols-[1fr_auto_1fr]';

describe('TriRow grid template', () => {
  afterEach(() => cleanup());

  it('is a three-track [1fr_auto_1fr] grid with centered items', async () => {
    const { TriRow } = await import('../src/pages/grammar/TriRow');
    const { container } = render(
      <TriRow
        testId="row"
        ku="Ez sêvê dixwim û avê vedixwim"
        ar="أنا آكل التفاحة وأشرب الماء"
        en="I eat the apple and drink the water"
      />,
    );
    const row = container.querySelector('[data-testid="row"]')!;
    const cls = row.className || '';

    // (1) exact three-track template + centered cross-axis
    expect(cls).toContain('grid');
    expect(cls.includes(GRID_TEMPLATE)).toBe(true);
    expect(cls).toContain('items-center');

    // (2) inline LTR direction — RTL pages (Arabic UI) must not flip columns
    const el = row as HTMLElement;
    expect(el.style.direction).toBe('ltr');

    // (3) cells: ku left / audio centered / right aligned
    const ku = el.querySelector('bdi[dir="ltr"]');
    const audio = el.querySelector('[data-testid="row-audio"]');
    const right = el.querySelector('[data-testid="row-right"]');
    expect(ku).toBeTruthy();
    expect(audio).toBeTruthy();
    expect(right).toBeTruthy();

    const audioCls = (audio as HTMLElement).className || '';
    expect(audioCls).toContain('justify-self-center');
    const rightCls = (right as HTMLElement).className || '';
    expect(rightCls).toContain('text-right');
    const kuCls = (ku as HTMLElement).className || '';
    expect(kuCls).toContain('min-w-0');
    expect(kuCls).toContain('break-words');
    expect(kuCls).toContain('text-left');
  });

  it('keeps the translation right/left/audio cells consistent when left text is long', async () => {
    const { TriRow } = await import('../src/pages/grammar/TriRow');
    const { container } = render(
      <TriRow
        testId="row"
        ku="Ez sêvê dixwim û avê vedixwim — hevokeke pir dirêj ji bo testê"
        ar="ترجمة عربية"
        en="English translation"
      />,
    );
    const row = container.querySelector('[data-testid="row"]') as HTMLElement;
    const cls = row.className || '';
    expect(cls).toContain('grid');
    expect(cls.includes(GRID_TEMPLATE)).toBe(true);
    expect(cls).toContain('items-center');
    expect(row.style.direction).toBe('ltr');
  });
});

describe('ConceptCard rows', () => {
  afterEach(() => cleanup());

  it('renders the title and all example rows with the TriRow grid template', async () => {
    const { ConceptCard } = await import('../src/pages/grammar/ConceptCard');
    const concept = {
      id: 'ez',
      term: 'Ez',
      ar: 'أنا',
      en: 'I',
      usage: { en: 'the first person singular', ar: 'ضمير المتكلم المفرد', ku: 'cînava kesê yekem' },
      examples: [
        { ku: 'Ez kurd im', ar: 'أنا كردي', en: 'I am Kurdish' },
        { ku: 'Ez nan dixwim', ar: 'أنا آكل الخبز', en: 'I eat bread' },
      ],
    };
    const { container } = render(<ConceptCard concept={concept as any} language="en" />);

    // title row + 2 example rows
    const title = container.querySelector('[data-testid="concept-title"]');
    const ex0 = container.querySelector('[data-testid="example-0"]');
    const ex1 = container.querySelector('[data-testid="example-1"]');

    for (const row of [title, ex0, ex1]) {
      expect(row).toBeTruthy();
      const cls = (row as HTMLElement).className || '';
      expect(cls).toContain('grid');
      expect(cls.includes(GRID_TEMPLATE)).toBe(true);
      expect(cls).toContain('items-center');
      expect((row as HTMLElement).style.direction).toBe('ltr');
    }
  });

  it('gives every ConceptCard row a matching audible target (audio always present)', async () => {
    const { ConceptCard } = await import('../src/pages/grammar/ConceptCard');
    const concept = {
      id: 'ez',
      term: 'Ez',
      ar: 'أنا',
      en: 'I',
      usage: { en: 'first person', ar: 'المتكلم', ku: 'kesê yekem' },
      examples: [
        { ku: 'Ez kurd im', ar: 'أنا كردي', en: 'I am Kurdish' },
        { ku: 'Tu nan dixwî', ar: 'أنتَ تأكل الخبز', en: 'You eat bread' },
        { ku: 'Em kurd in', ar: 'نحن أكراد', en: 'We are Kurds' },
      ],
    };
    const { container } = render(<ConceptCard concept={concept as any} language="ar" />);
    const rowIds = ['example-0', 'example-1', 'example-2'];
    for (const id of rowIds) {
      const row = container.querySelector(`[data-testid="${id}"]`);
      expect(row).toBeTruthy();
      const audio = row!.querySelector(`[data-testid="${id}-audio"]`);
      expect(audio).toBeTruthy();
      const button = audio!.querySelector('button');
      expect(button).toBeTruthy();
    }
  });
});
