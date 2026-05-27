/**
 * Script de Optimización de Imágenes
 *
 * Convierte imágenes pesadas a WebP con compresión óptima.
 * Mantiene las originales en una carpeta de backup.
 *
 * Uso:
 *   npm run optimize-images
 *
 * Requisitos:
 *   npm install sharp --save-dev
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const BACKUP_DIR = path.join(ROOT_DIR, 'public', '_originals_backup');

// Configuración de calidad por tipo de imagen
const CONFIG = {
  // Imágenes de fondo/hero - calidad alta
  backgrounds: {
    quality: 80,
    effort: 6,
  },
  // Imágenes de contenido - calidad media-alta
  content: {
    quality: 75,
    effort: 6,
  },
  // Thumbnails/iconos - calidad media
  thumbnails: {
    quality: 70,
    effort: 4,
  },
};

// Lista de imágenes a optimizar con sus configuraciones
const IMAGES_TO_OPTIMIZE = [
  // CRÍTICAS - Más de 1MB
  {
    input: 'assets/images/modal-bg.svg',
    output: 'assets/images/modal-bg.webp',
    type: 'backgrounds',
    maxWidth: 1200,
    note: 'SVG pesado convertido a WebP',
  },
  {
    input: 'assets/images/riesgos_evitar.png',
    output: 'assets/images/riesgos_evitar.webp',
    type: 'content',
    maxWidth: 1200,
  },
  {
    input: 'assets/images/booking-sidebar.png',
    output: 'assets/images/booking-sidebar.webp',
    type: 'backgrounds',
    maxWidth: 800,
  },
  {
    input: 'assets/images/cuarta-foto-process.jpeg',
    output: 'assets/images/cuarta-foto-process.webp',
    type: 'content',
    maxWidth: 800,
  },
  {
    input: 'assets/images/segunda-foto-process.jpeg',
    output: 'assets/images/segunda-foto-process.webp',
    type: 'content',
    maxWidth: 800,
  },
  {
    input: 'assets/images/primera-foto-process.png',
    output: 'assets/images/primera-foto-process.webp',
    type: 'content',
    maxWidth: 800,
  },
  {
    input: 'assets/images/tercera-foto-process.jpeg',
    output: 'assets/images/tercera-foto-process.webp',
    type: 'content',
    maxWidth: 800,
  },
  // MEDIANAS - 100KB - 500KB
  {
    input: 'assets/images/yape-qr.png',
    output: 'assets/images/yape-qr.webp',
    type: 'content',
    maxWidth: 400,
  },
  {
    input: 'assets/images/modal-bg.png',
    output: 'assets/images/modal-bg-png.webp',
    type: 'backgrounds',
    maxWidth: 800,
  },
  {
    input: 'assets/images/login-side.png',
    output: 'assets/images/login-side.webp',
    type: 'backgrounds',
    maxWidth: 600,
  },
  {
    input: 'assets/images/modal-bg-3.png',
    output: 'assets/images/modal-bg-3.webp',
    type: 'backgrounds',
    maxWidth: 800,
  },
  {
    input: 'assets/images/modal-bg-2.png',
    output: 'assets/images/modal-bg-2.webp',
    type: 'backgrounds',
    maxWidth: 800,
  },
  {
    input: 'assets/images/frame-hero.jpg',
    output: 'assets/images/frame-hero.webp',
    type: 'backgrounds',
    maxWidth: 1920,
  },
  {
    input: 'assets/images/verificarlo-logo.png',
    output: 'assets/images/verificarlo-logo.webp',
    type: 'thumbnails',
    maxWidth: 300,
  },
];

// Formatear bytes a formato legible
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Obtener tamaño de archivo
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

// Crear directorio si no existe
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Hacer backup del archivo original
async function backupFile(inputPath, relativePath) {
  const backupPath = path.join(BACKUP_DIR, relativePath);
  await ensureDir(path.dirname(backupPath));

  try {
    await fs.access(backupPath);
    // Ya existe backup, no sobrescribir
  } catch {
    await fs.copyFile(inputPath, backupPath);
  }
}

// Optimizar una imagen
async function optimizeImage(imageConfig) {
  const inputPath = path.join(PUBLIC_DIR, imageConfig.input);
  const outputPath = path.join(PUBLIC_DIR, imageConfig.output);
  const config = CONFIG[imageConfig.type];

  try {
    // Verificar que el archivo existe
    await fs.access(inputPath);

    // Obtener tamaño original
    const originalSize = await getFileSize(inputPath);

    // Hacer backup
    await backupFile(inputPath, imageConfig.input);

    // Crear directorio de salida si no existe
    await ensureDir(path.dirname(outputPath));

    // Procesar imagen
    let pipeline = sharp(inputPath);

    // Redimensionar si es necesario
    if (imageConfig.maxWidth) {
      pipeline = pipeline.resize({
        width: imageConfig.maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // Convertir a WebP
    await pipeline
      .webp({
        quality: config.quality,
        effort: config.effort,
        smartSubsample: true,
      })
      .toFile(outputPath);

    // Obtener tamaño optimizado
    const optimizedSize = await getFileSize(outputPath);
    const savings = originalSize - optimizedSize;
    const percentage = ((savings / originalSize) * 100).toFixed(1);

    return {
      input: imageConfig.input,
      output: imageConfig.output,
      originalSize,
      optimizedSize,
      savings,
      percentage,
      success: true,
    };
  } catch (error) {
    return {
      input: imageConfig.input,
      output: imageConfig.output,
      error: error.message,
      success: false,
    };
  }
}

// Función principal
async function main() {
  console.log('\n🖼️  OPTIMIZACIÓN DE IMÁGENES VERIFICARLO\n');
  console.log('=' .repeat(60));

  // Crear directorio de backup
  await ensureDir(BACKUP_DIR);
  console.log(`\n📁 Backup de originales en: ${BACKUP_DIR}\n`);

  const results = [];
  let totalOriginal = 0;
  let totalOptimized = 0;
  let successCount = 0;
  let errorCount = 0;

  // Procesar cada imagen
  for (const imageConfig of IMAGES_TO_OPTIMIZE) {
    process.stdout.write(`⏳ Procesando ${imageConfig.input}...`);

    const result = await optimizeImage(imageConfig);
    results.push(result);

    if (result.success) {
      totalOriginal += result.originalSize;
      totalOptimized += result.optimizedSize;
      successCount++;
      console.log(` ✅ ${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)} (-${result.percentage}%)`);
    } else {
      errorCount++;
      console.log(` ❌ Error: ${result.error}`);
    }
  }

  // Resumen
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 RESUMEN DE OPTIMIZACIÓN\n');

  console.log(`   Imágenes procesadas: ${successCount}/${IMAGES_TO_OPTIMIZE.length}`);
  console.log(`   Errores: ${errorCount}`);
  console.log(`\n   Tamaño original total:   ${formatBytes(totalOriginal)}`);
  console.log(`   Tamaño optimizado total: ${formatBytes(totalOptimized)}`);
  console.log(`   Ahorro total:            ${formatBytes(totalOriginal - totalOptimized)} (${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%)`);

  // Tabla detallada
  console.log('\n\n📋 DETALLE POR IMAGEN:\n');
  console.log('┌─────────────────────────────────────────┬──────────┬──────────┬─────────┐');
  console.log('│ Archivo                                 │ Original │ WebP     │ Ahorro  │');
  console.log('├─────────────────────────────────────────┼──────────┼──────────┼─────────┤');

  for (const result of results) {
    if (result.success) {
      const name = result.input.replace('assets/images/', '').substring(0, 39).padEnd(39);
      const orig = formatBytes(result.originalSize).padStart(8);
      const opt = formatBytes(result.optimizedSize).padStart(8);
      const save = (`-${result.percentage}%`).padStart(7);
      console.log(`│ ${name} │ ${orig} │ ${opt} │ ${save} │`);
    }
  }

  console.log('└─────────────────────────────────────────┴──────────┴──────────┴─────────┘');

  // Instrucciones post-optimización
  console.log('\n\n🔧 SIGUIENTES PASOS:\n');
  console.log('   1. Actualizar las referencias en el código de .png/.jpg/.jpeg a .webp');
  console.log('   2. Probar que las imágenes se vean correctamente');
  console.log('   3. Eliminar las imágenes originales de /public (backup en _originals_backup)');
  console.log('   4. Hacer commit de los cambios\n');

  // Generar script de actualización de referencias
  console.log('   Para actualizar referencias automáticamente, ejecuta:');
  console.log('   npm run update-image-refs\n');
}

main().catch(console.error);
