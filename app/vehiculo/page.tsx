/**
 * VehiculoPage - Server Component
 * Pre-loads brands and inspections on the server for instant rendering
 */

import { getBrandsServer, getInspectionsServer } from "@/services/vehicle/vehicle.server";
import VehiculoForm from "./VehiculoForm";

export default async function VehiculoPage() {
    // Fetch data in parallel on the server
    const [brands, inspections] = await Promise.all([
        getBrandsServer(),
        getInspectionsServer()
    ]);

    // Pass pre-loaded data to client component
    return <VehiculoForm initialBrands={brands} initialInspections={inspections} />;
}
