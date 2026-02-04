/**
 * VehiculoPage - Server Component
 * Pre-loads brands and inspection plans on the server for instant rendering
 */

import { getBrandsServer, getInspectionPlansServer } from "@/services/vehicle/vehicle.server";
import VehiculoForm from "./VehiculoForm";

export default async function VehiculoPage() {
    // Fetch data in parallel on the server
    const [brands, inspectionPlans] = await Promise.all([
        getBrandsServer(),
        getInspectionPlansServer()
    ]);

    // Pass pre-loaded data to client component
    return <VehiculoForm initialBrands={brands} initialInspectionPlans={inspectionPlans} />;
}
