import { getInspectionPlansServer, getBrandsServer } from "@/services/vehicle/vehicle.server";
import AgendarForm from "./AgendarForm";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendar Inspección Vehicular Online",
  description:
    "Agenda tu inspección de auto usado en Lima. Elige fecha, hora y ubicación. Pago seguro con tarjeta, Yape o Plin. Resultados en 24 horas. Desde S/249.",
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
    url: "https://verificarlo.pe/agendar",
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

  return <AgendarForm initialInspections={inspections} initialBrands={brands} />;
}
