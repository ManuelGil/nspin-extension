import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

import dts from 'vite-plugin-dts';

// Resolve __dirname in ESM context
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    target: 'node22',
    ssr: true,
    sourcemap: true,
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'nspin-extension',
      formats: ['es', 'cjs'],
      fileName: (format) =>
        format === 'es' ? 'index.js' : 'index.cjs',
    },
    rollupOptions: {
      external: [
        'nspin',
        'node:events',
        'node:perf_hooks',
      ],
      treeshake: {
        moduleSideEffects: false,
      },
      output: {
        exports: 'named',
        sourcemapExcludeSources: false,
      },
    },
  },
  resolve: {
    conditions: ['node'],
  },
  plugins: [
    dts({
      outDirs: ['dist'],
      insertTypesEntry: false,
      tsconfigPath: './tsconfig.json',
    }),
  ],
});
