/**
 * Custom build script to create a single widget.js file
 * This script bundles the widget into a single IIFE that can be embedded
 */

import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildWidget() {
  console.log('🚀 Building widget...');
  
  try {
    // Build the widget as a library
    await build({
      root: __dirname,
      build: {
        lib: {
          entry: resolve(__dirname, 'src/scripts/widget.ts'),
          name: 'ChatbotWidget',
          fileName: 'widget',
          formats: ['iife'],
        },
        outDir: 'dist',
        emptyOutDir: false,
        cssCodeSplit: false,
        rollupOptions: {
          output: {
            entryFileNames: 'widget.js',
            assetFileNames: 'widget.[ext]',
            inlineDynamicImports: true,
          },
        },
      },
    });
    
    console.log('✅ Widget built successfully!');
    console.log('📦 Output: dist/widget.js');
    
    // Check file size
    const stats = fs.statSync(resolve(__dirname, 'dist/widget.js'));
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`📊 File size: ${fileSizeInKB} KB`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildWidget();
