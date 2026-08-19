import React from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import '../src/index.css';

/**
 * Locale/direction toolbar: every story can be flipped between English,
 * Kurmancî (LTR) and Arabic (RTL). The decorator mirrors MainLayout's
 * behaviour (document-level lang + dir) so RTL styling (`start/end`
 * logical properties, `rtl:` variants) renders exactly as in the app.
 */
const withLocale: Decorator = (Story, context) => {
  const locale = String(context.globals.locale || 'en');
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  return (
    <div dir={dir} className="font-sans text-ink">
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withLocale],
  globalTypes: {
    locale: {
      description: 'App language / direction',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English (LTR)' },
          { value: 'ku', title: 'Kurmancî (LTR)' },
          { value: 'ar', title: 'العربية (RTL)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    locale: 'en',
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      options: {
        ivory: { name: 'Warm Porcelain (app canvas)', value: '#FBFBFA' },
        dark: { name: 'Slate 950 (arcade)', value: '#020617' },
      },
    },
  },
};

export default preview;
