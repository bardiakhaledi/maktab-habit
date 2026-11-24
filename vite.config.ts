import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/** Files in /public that must be available offline. */
const PUBLIC_PRECACHE = [
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon.svg',
];

/**
 * Emits sw.js with a precache list of every built file. The cache version is a
 * hash of the (content-hashed) file names, so each release gets a new cache and
 * the browser sees a changed sw.js and offers the update.
 */
function serviceWorker(): Plugin {
  return {
    name: 'maktab-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const files = ['./', './index.html', ...[...built, ...PUBLIC_PRECACHE].filter((f) => f !== 'index.html').map((f) => `./${f}`)];
      const version = createHash('sha256').update(files.join('|')).digest('hex').slice(0, 12);
      const template = readFileSync(fileURLToPath(new URL('./src/pwa/sw-template.js', import.meta.url)), 'utf8');
      const source = template.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(files, null, 2));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0, // keep fonts/SVG as separate cacheable files
    sourcemap: false,
  },
  plugins: [serviceWorker()],
  // `npm run dev` talks to a locally running `npm start` server.
  server: {
    proxy: { '/api': 'http://localhost:8080', '/admin': 'http://localhost:8080' },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
