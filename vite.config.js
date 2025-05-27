// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/BIMCoin/', // Correcte per a GitHub Pages en el repositori BIMCoin
  build: {
    outDir: 'docs', // On es generen els fitxers
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




