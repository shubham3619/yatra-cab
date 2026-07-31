import preset from '../design-system/tailwind-preset.js';

export default {
  presets: [preset],
  content: ['./index.html', './src/**/*.{js,jsx}', '../design-system/src/**/*.{js,jsx}'],
};
