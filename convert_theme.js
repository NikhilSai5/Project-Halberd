import fs from 'fs';
import path from 'path';

// Read the tailwind config
import config from './tailwind.config.js';

const theme = config.theme.extend;
let css = `@import "tailwindcss";\n\n@theme {\n`;

// Colors
for (const [key, value] of Object.entries(theme.colors || {})) {
  css += `  --color-${key}: ${value};\n`;
}

// Spacing
for (const [key, value] of Object.entries(theme.spacing || {})) {
  css += `  --spacing-${key}: ${value};\n`;
}

// FontFamily
for (const [key, value] of Object.entries(theme.fontFamily || {})) {
  css += `  --font-${key}: ${value.join(', ')};\n`;
}

// FontSize (complex because it has [size, options])
for (const [key, value] of Object.entries(theme.fontSize || {})) {
  const size = value[0];
  const opts = value[1] || {};
  css += `  --text-${key}: ${size};\n`;
  if (opts.lineHeight) {
    css += `  --text-${key}--line-height: ${opts.lineHeight};\n`;
  }
  if (opts.fontWeight) {
    css += `  --text-${key}--font-weight: ${opts.fontWeight};\n`;
  }
  if (opts.letterSpacing) {
    css += `  --text-${key}--letter-spacing: ${opts.letterSpacing};\n`;
  }
}

// BorderRadius
for (const [key, value] of Object.entries(theme.borderRadius || {})) {
  if (key === 'DEFAULT') {
    css += `  --radius: ${value};\n`;
  } else {
    css += `  --radius-${key}: ${value};\n`;
  }
}

css += `}\n`;

fs.writeFileSync('./assets/tailwind.css', css);
console.log('Wrote to tailwind.css');

const defaultConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./components/**/*.{html,ts,tsx}",
    "./pages/**/*.{html,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

fs.writeFileSync('./tailwind.config.js', defaultConfig);
console.log('Wrote to tailwind.config.js');
