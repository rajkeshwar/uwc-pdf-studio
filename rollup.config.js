import resolve    from '@rollup/plugin-node-resolve';
import commonjs   from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace    from '@rollup/plugin-replace';
import terser     from '@rollup/plugin-terser';
import copy       from 'rollup-plugin-copy';
import { rollupPluginHTML as html } from '@web/rollup-plugin-html';
import { readFileSync } from 'fs';

const pkg    = JSON.parse(readFileSync('./package.json', 'utf-8'));
const isProd = process.env.NODE_ENV === 'production';

export default {
  // ← Point at index.html, not main.ts
  // The HTML plugin reads the <script type="module" src="/src/main.ts"> tag,
  // bundles that entry point, rewrites the tag to the hashed output filename,
  // and emits index.html into dist/.
  input: 'index.html',

  output: {
    dir:            'dist',
    format:         'es',
    sourcemap:      !isProd,
    chunkFileNames: 'chunks/[name]-[hash].js',
    manualChunks: {
      lit: ['lit'],
    },
  },

  plugins: [
    // Must come first — parses HTML and hands the JS entry to Rollup
    html({
      minify: isProd,
    }),

    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
        '__VERSION__':          JSON.stringify(pkg.version),
      },
    }),

    resolve({
      browser:          true,
      preferBuiltins:   false,
      exportConditions: ['browser', 'import', 'module', 'default'],
    }),

    commonjs(),

    typescript({
      tsconfig:       './tsconfig.json',
      declaration:    false,  // not needed for the app bundle
      declarationMap: false,
      sourceMap:      !isProd,
    }),

    // Copy any static assets that aren't imported by JS
    copy({
      targets: [
        // Add entries here if you have a public/ or assets/ folder, e.g.:
        // { src: 'public/favicon.ico', dest: 'dist' },
      ],
      hook: 'writeBundle',
    }),

    isProd && terser({
      format:   { comments: false },
      compress: { drop_console: true, passes: 2 },
    }),
  ].filter(Boolean),

  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  },
};