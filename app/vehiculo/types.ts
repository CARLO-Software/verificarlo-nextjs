export type AgendarVehiculo = {
    brandId: number | null;
    model: number | null;
    year: number | null;
    inspectionPlanId: number | null;
    mileage: number | null;
    plate: string;
    fechaEstimada: string;
    horaEstimada: string;
}

// Tipos para datos de la base de datos
export type Brand = {
    id: number;
    name: string;
    logo: string;
};

export type Model = {
    id: number;
    brandId: number;
    name: string;
    logo?: string;
    yearFrom: number;
    yearTo: number;
};

export type InspectionPlanItem = {
    id: number;
    inspectionPlanId: number;
    label: string;
};

export type InspectionPlan = {
    id: number;
    type: "legal" | "basica" | "completa";
    title: string;
    description: string;
    price: number;
    items?: InspectionPlanItem[];
};