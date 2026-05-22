import { Suspense } from "react";
import { getInspectionPlansServer, getBrandsServer } from "@/services/vehicle/vehicle.server";
import AgendarForm from "./AgendarForm";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendar Inspección Vehicular Online",
  description:
    "Agenda tu inspección de auto usado en Lima. Elige fecha, hora y ubicación. Pago seguro con tarjeta, Yape o Plin. Resultados en 24 horas. Desde S/299.",
  keywords: [
    "agendar inspección vehicular",
    "reservar inspección auto",
    "inspección a domicilio Lima",
    "precio inspección vehicular",
  ],
  openGraph: {
    title: "Agenda tu Inspección Vehicular - VerifiCARLO",
    description:
      "Reserva online en minutos. Inspección profesional de más de 200 puntos. Servicio a domicilio en Lima.",
    type: "website",
    url: "https://verificarlo.com/agendar",
  },
  alternates: {
    canonical: "/agendar",
  },
};

export default async function AgendarPage() {
  // Pre-cargar datos del servidor
  const [inspections, brands] = await Promise.all([
    getInspectionPlansServer(),
    getBrandsServer(),
  ]);

  return (
    <Suspense fallback={<AgendarLoadingSkeleton />}>
      <AgendarForm initialInspections={inspections} initialBrands={brands} />
    </Suspense>
  );
}

function AgendarLoadingSkeleton() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40,
            height: 40,
            border: "3px solid #e5e7eb",
            borderTopColor: "#3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p style={{ color: "#6b7280" }}>Cargando...</p>
        </div>
      </div>
    </div>
  );
}
