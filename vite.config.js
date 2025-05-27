import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: 'public',
  base: '/BIMCoin/',
  build: {
    assetsDir: '', // <-- això posa els assets a /dist directament!
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        visor: resolve(__dirname, 'visor.html'),
        verify: resolve(__dirname, 'verify.html'),
        porpuse: resolve(__dirname, 'porpuse.html'),
        faqs: resolve(__dirname, 'faqs.html'),
      }
    }
  }
});



