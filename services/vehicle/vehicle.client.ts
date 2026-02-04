import { AgendarVehiculo, Brand, Model, InspectionPlan } from "@/app/vehiculo/types";

// ============================================
// GET - Obtener marcas
// ============================================
export async function getBrands(): Promise<Brand[]> {
    const res = await fetch("/api/vehicles/brands");

    if (!res.ok) {
        throw new Error("Error al obtener marcas");
    }

    return res.json();
}

// ============================================
// GET - Obtener modelos por marca
// ============================================
export async function getModelsByBrand(brandId: number): Promise<Model[]> {
    const res = await fetch(`/api/vehicles/models/${brandId}`);

    if (!res.ok) {
        throw new Error("Error al obtener modelos");
    }

    return res.json();
}

// ============================================
// GET - Obtener planes de inspección
// ============================================
export async function getInspectionPlans(): Promise<InspectionPlan[]> {
    const res = await fetch("/api/vehicles/inspections");

    if (!res.ok) {
        throw new Error("Error al obtener planes de inspección");
    }

    return res.json();
}

// ============================================
// POST - Agendar vehículo
// ============================================
export async function agendarVehiculo(payload: AgendarVehiculo) {
    //Llamar a la API de autenticación, siendo Next.js el backend
    const res = await fetch("/api/vehicles/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error("Agendamiento fallido");
    }
    
    return res.json();
}