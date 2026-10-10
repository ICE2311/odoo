import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import 'dotenv/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/server': path.resolve(__dirname, './src/tests/__mocks__/next/server.ts')
    }
  }
});
