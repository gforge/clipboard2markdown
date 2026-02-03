import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

export default defineConfig({
  base: process.env.VITE_BASE || new URL(pkg.homepage || '/').pathname,
  plugins: [react()],
});
