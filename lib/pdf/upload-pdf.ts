// ============================================
// Subida de PDF a Cloudinary
// ============================================

import { cloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export interface UploadPDFResult {
  secure_url: string;
  public_id: string;
}

// Generar URL firmada para un PDF (sin expiración)
export function generateSignedPdfUrl(publicId: string): string {
  return cloudinary.url(`${publicId}.pdf`, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    secure: true,
  });
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
  const publicId = `informe-${reportId}-${timestamp}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'authenticated',
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
