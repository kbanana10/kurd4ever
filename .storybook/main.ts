import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook — component isolation & visual consistency lab.
 *
 * Reuses the app's vite.config.ts (Tailwind v4 plugin, define flags) but
 * strips the PWA plugin: service-worker generation makes no sense inside
 * the Storybook dev/build pipeline and slows it down.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    const plugins = (viteConfig.plugins ?? []).flat();
    viteConfig.plugins = plugins.filter((plugin) => {
      if (!plugin || Array.isArray(plugin)) return true;
      const name = 'name' in plugin ? String(plugin.name) : '';
      return !name.startsWith('vite-plugin-pwa');
    });
    return viteConfig;
  },
};

export default config;
