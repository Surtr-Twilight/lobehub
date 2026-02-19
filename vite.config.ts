import path from 'node:path';

import react from '@vitejs/plugin-react';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const isDesktopBuild = process.env.IS_DESKTOP_BUILD === '1';
const isMobileBuild = process.env.IS_MOBILE_BUILD === '1';
const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: 'public/spa',
    rollupOptions: {
      input: {
        desktop: path.resolve(__dirname, 'index.html'),
        mobile: path.resolve(__dirname, 'index.mobile.html'),
      },
    },
  },
  define: {
    'process.env.NEXT_PUBLIC_IS_DESKTOP_APP': JSON.stringify('0'),
    '__DEV__': JSON.stringify(process.env.NODE_ENV === 'development'),
    '__DESKTOP_BUILD__': JSON.stringify(isDesktopBuild),
    '__MOBILE_BUILD__': JSON.stringify(isMobileBuild),
  },
  plugins: [
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
