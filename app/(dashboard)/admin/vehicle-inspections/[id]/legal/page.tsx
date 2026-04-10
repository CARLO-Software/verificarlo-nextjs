/**
 * Gestión de Estado Legal de VehicleInspection
 * Ruta: /admin/vehicle-inspections/[id]/legal
 *
 * Permite al admin gestionar el estado legal de una inspección
 * de vehículo de forma independiente al proceso mecánico.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { VehicleInspectionLegalClient } from './VehicleInspectionLegalClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VehicleInspectionLegalPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const { id } = await params;
  const inspectionId = parseInt(id, 10);

  if (isNaN(inspectionId)) {
    redirect('/admin/inspecciones');
  }

  // Obtener VehicleInspection con datos del vehículo y cliente
  const inspection = await db.vehicleInspection.findUnique({
    where: { id: inspectionId },
    include: {
      vehicle: {
        include: {
          model: {
            include: { brand: true },
          },
        },
      },
      client: {
        select: { id: true, name: true, email: true, phone: true },
      },
      assignedAdmin: {
        select: { id: true, name: true },
      },
      assignedMechanic: {
        select: { id: true, name: true },
      },
    },
  });

  if (!inspection) {
    redirect('/admin/inspecciones');
  }

  // Si está bloqueado (sin placa), no permitir acceso
  if (inspection.legalStatus === 'BLOQUEADO') {
    redirect('/admin/inspecciones');
  }

  const vehicleDescription = `${inspection.vehicle.model.brand.name} ${inspection.vehicle.model.name} (${inspection.vehicle.year})`;

  // Parsear datos JSON si existen
  const legalReportData = inspection.legalReportData as any || null;
  const legalScreenshots = inspection.legalScreenshots as any || null;

  return (
    <VehicleInspectionLegalClient
      inspectionId={inspection.id}
      plate={inspection.plate}
      vehicleDescription={vehicleDescription}
      clientName={inspection.client.name}
      clientEmail={inspection.client.email}
      clientPhone={inspection.client.phone}
      legalStatus={inspection.legalStatus}
      mechanicalStatus={inspection.mechanicalStatus}
      legalNotes={inspection.legalNotes}
      legalReportData={legalReportData}
      legalScreenshots={legalScreenshots}
      assignedAdmin={inspection.assignedAdmin}
      assignedMechanic={inspection.assignedMechanic}
      legalStartedAt={inspection.legalStartedAt?.toISOString() || null}
      legalCompletedAt={inspection.legalCompletedAt?.toISOString() || null}
      currentUserId={session.user.id}
    />
  );
}

export const dynamic = 'force-dynamic';
