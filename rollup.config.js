import resolve   from '@rollup/plugin-node-resolve';
import commonjs  from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace   from '@rollup/plugin-replace';
import terser    from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const isProd = process.env.NODE_ENV === 'production';

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'src/main.ts',

  output: {
    dir:            'dist',
    format:         'es',
    sourcemap:      !isProd,
    chunkFileNames: 'chunks/[name]-[hash].js',
    manualChunks: {
      // Lit runtime stays in its own chunk (shared, long-cached)
      lit:     ['lit'],
      // Each plugin is lazy-loaded, but core is always needed
    },
  },

  plugins: [
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
        '__VERSION__': JSON.stringify(pkg.version),
      },
    }),
    resolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json', sourceMap: !isProd }),
    isProd && terser({
      format: { comments: false },
      compress: { drop_console: true, passes: 2 },
    }),
  ].filter(Boolean),

  // Keep external CDN libraries out of the bundle
  external: [],

  onwarn(warning, warn) {
    // Suppress circular dependency warnings from lit internals
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  },
};
