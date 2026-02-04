import { getInspectionPlansServer, getBrandsServer } from "@/services/vehicle/vehicle.server";
import AgendarForm from "./AgendarForm";

export const metadata = {
  title: "Agendar Inspección | VerifiCARLO",
  description: "Agenda tu inspección vehicular en línea. Selecciona fecha, hora y paga de forma segura.",
};

export default async function AgendarPage() {
  // Pre-cargar datos del servidor
  const [inspections, brands] = await Promise.all([
    getInspectionPlansServer(),
    getBrandsServer(),
  ]);

  return <AgendarForm initialInspections={inspections} initialBrands={brands} />;
}
