import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

// import { createDependencyChunksPlugin } from './plugins/vite/createDependencyChunksPlugin';

const isDesktopBuild = process.env.IS_DESKTOP_BUILD === '1';
const isAnalyze = process.env.ANALYZE === 'true';

const isDev = process.env.NODE_ENV === 'development';
export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: 'public/spa',
  },
  base: isDev ? '/' : '/spa/',
  define: {
    'process.env.NEXT_PUBLIC_IS_DESKTOP_APP': JSON.stringify('0'),
    '__DEV__': JSON.stringify(process.env.NODE_ENV === 'development'),
    '__DESKTOP_BUILD__': JSON.stringify(isDesktopBuild),
  },
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      include: ['crypto', 'http', 'https', 'path', 'stream', 'url', 'util', 'zlib'],
      protocolImports: true,
    }),
    tsconfigPaths(),
    // ...(isDev
    //   ? [
    //       codeInspectorPlugin({
    //         bundler: 'vite',
    //         hotKeys: ['altKey', 'ctrlKey'],
    //       }),
    //     ]
    //   : []),
    react({
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
      jsxImportSource: '@emotion/react',
    }),

    ...(isAnalyze
      ? [
          analyzer({
            analyzerMode: 'server',
            openAnalyzer: true,
          }),
        ]
      : []),
  ],
  server: {
    cors: true,
    hmr: {
      port: 3011,
    },
    port: 3011,
    proxy: {
      '/api': 'http://localhost:3010',
      '/oidc': 'http://localhost:3010',
      '/trpc': 'http://localhost:3010',
      '/webapi': 'http://localhost:3010',
    },
  },
});
