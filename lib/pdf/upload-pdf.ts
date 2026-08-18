// ============================================
// Subida de PDF a Cloudinary
// ============================================

import { cloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;
const APP_URL = process.env.NEXTAUTH_URL || 'https://verificarlo.com';

export interface UploadPDFResult {
  secure_url: string;
  public_id: string;
}

// Generar URL de descarga con token firmado (funciona sin login desde email)
export function generateSignedPdfUrl(bookingId: number): string {
  const token = jwt.sign(
    { bookingId, purpose: 'pdf-download' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return `${APP_URL}/api/inspections/${bookingId}/report/pdf?token=${token}`;
}

// Subir PDF a Cloudinary
export async function uploadPDFToCloudinary(
  buffer: Buffer,
  reportId: number
): Promise<UploadPDFResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary no está configurado. Verifica las variables de entorno.');
  }

  const timestamp = Date.now();
  // Incluir .pdf en el public_id para que Cloudinary lo reconozca como PDF
  const publicId = `informe-${reportId}-${timestamp}.pdf`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'upload',
        public_id: publicId,
        folder: 'verificarlo/reports',
        overwrite: true,
        invalidate: true,
        tags: ['informe-inspeccion', `report-${reportId}`],
      },
      (error, result) => {
        if (error) {
          console.error('Error subiendo PDF a Cloudinary:', error);
          reject(new Error(`Error al subir PDF: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error('No se recibió respuesta de Cloudinary'));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    ).end(buffer);
  });
}

// Eliminar PDF de Cloudinary (si se necesita regenerar)
export async function deletePDFFromCloudinary(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
      invalidate: true,
    });
  } catch (error) {
    console.error('Error eliminando PDF de Cloudinary:', error);
  }
}
