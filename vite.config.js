import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/BIMCoin/',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: '.nojekyll',   // Fitxer a copiar
          dest: '.'           // El destí dins de la carpeta `docs/`
        }
      ]
    })
  ],
  build: {
    outDir: 'docs',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        visor: resolve(__dirname, 'visor.html'),
        verify: resolve(__dirname, 'verify.html'),
        porpuse: resolve(__dirname, 'porpuse.html'),
        faqs: resolve(__dirname, 'faqs.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      }
    }
  }
});






