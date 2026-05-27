/**
 * Script para actualizar referencias de imágenes
 *
 * Actualiza las referencias en el código de .png/.jpg/.jpeg a .webp
 * después de ejecutar optimize-images.
 *
 * Uso:
 *   npm run update-image-refs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Mapeo de imágenes originales a WebP
const IMAGE_REPLACEMENTS = [
  // Imágenes del proceso
  { from: '/assets/images/primera-foto-process.png', to: '/assets/images/primera-foto-process.webp' },
  { from: '/assets/images/segunda-foto-process.jpeg', to: '/assets/images/segunda-foto-process.webp' },
  { from: '/assets/images/tercera-foto-process.jpeg', to: '/assets/images/tercera-foto-process.webp' },
  { from: '/assets/images/cuarta-foto-process.jpeg', to: '/assets/images/cuarta-foto-process.webp' },

  // Imágenes de modales/backgrounds
  { from: '/assets/images/modal-bg.png', to: '/assets/images/modal-bg-png.webp' },
  { from: '/assets/images/modal-bg-2.png', to: '/assets/images/modal-bg-2.webp' },
  { from: '/assets/images/modal-bg-3.png', to: '/assets/images/modal-bg-3.webp' },

  // Otras imágenes
  { from: '/assets/images/booking-sidebar.png', to: '/assets/images/booking-sidebar.webp' },
  { from: '/assets/images/login-side.png', to: '/assets/images/login-side.webp' },
  { from: '/assets/images/frame-hero.jpg', to: '/assets/images/frame-hero.webp' },
  { from: '/assets/images/yape-qr.png', to: '/assets/images/yape-qr.webp' },

  // Logo (opcional - next/image ya optimiza)
  // { from: '/assets/images/verificarlo-logo.png', to: '/assets/images/verificarlo-logo.webp' },
];

// Archivos a buscar
const FILE_PATTERNS = [
  'app/**/*.tsx',
  'app/**/*.ts',
  'app/**/*.css',
  'components/**/*.tsx',
  'components/**/*.ts',
];

async function main() {
  console.log('\n🔄 ACTUALIZACIÓN DE REFERENCIAS DE IMÁGENES\n');
  console.log('=' .repeat(60));

  let totalReplacements = 0;
  const modifiedFiles = [];

  // Buscar todos los archivos
  const files = await glob(FILE_PATTERNS, {
    cwd: ROOT_DIR,
    ignore: ['node_modules/**', '.next/**', 'scripts/**'],
  });

  console.log(`\n📂 Archivos encontrados: ${files.length}\n`);

  for (const file of files) {
    const filePath = path.join(ROOT_DIR, file);
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    let fileReplacements = 0;

    for (const replacement of IMAGE_REPLACEMENTS) {
      if (content.includes(replacement.from)) {
        content = content.split(replacement.from).join(replacement.to);
        modified = true;
        fileReplacements++;
        totalReplacements++;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      modifiedFiles.push({ file, count: fileReplacements });
      console.log(`   ✅ ${file} (${fileReplacements} cambios)`);
    }
  }

  // Resumen
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 RESUMEN\n');
  console.log(`   Archivos modificados: ${modifiedFiles.length}`);
  console.log(`   Total de reemplazos: ${totalReplacements}`);

  if (modifiedFiles.length > 0) {
    console.log('\n📋 ARCHIVOS MODIFICADOS:\n');
    for (const { file, count } of modifiedFiles) {
      console.log(`   - ${file} (${count} referencias actualizadas)`);
    }
  }

  console.log('\n\n🔧 SIGUIENTES PASOS:\n');
  console.log('   1. Revisar los cambios: git diff');
  console.log('   2. Probar la aplicación: npm run dev');
  console.log('   3. Verificar que las imágenes cargan correctamente');
  console.log('   4. Hacer commit: git add . && git commit -m "chore: update image refs to webp"\n');
}

main().catch(console.error);
