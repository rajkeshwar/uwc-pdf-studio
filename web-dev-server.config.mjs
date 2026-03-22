import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  rootDir:     '.',
  appIndex:    'index.html',   // index.html is now at the project root
  open:        true,
  watch:       true,
  nodeResolve: true,
  plugins: [
    esbuildPlugin({
      ts:       true,
      target:   'es2020',
      tsconfig: './tsconfig.json',
    }),
  ],
};
