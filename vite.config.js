import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: 'public',
  base: '/BIMCoin/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        visor: resolve(__dirname, 'visor.html')
      }
    }
  }
});

