/**
 * Página de Informe Legal - Server Component
 * Ruta: /admin/inspecciones/[id]/legal
 *
 * El [id] corresponde al ID del InspectionReport
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLegalReportByReportId } from '@/services/legalReport/legalReport.server';
import { LegalReportClient } from './LegalReportClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegalReportPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const { id } = await params;
  const reportId = parseInt(id, 10);

  if (isNaN(reportId)) {
    redirect('/admin/inspecciones');
  }

  // Obtener el informe legal
  const legalReport = await getLegalReportByReportId(reportId);

  if (!legalReport) {
    // Si no existe, podría ser que la inspección no ha sido completada
    redirect('/admin/inspecciones');
  }

  return (
    <LegalReportClient
      legalReportId={legalReport.id}
      currentUserId={session.user.id}
    />
  );
}

export const dynamic = 'force-dynamic';
