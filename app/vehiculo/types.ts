export type AgendarVehiculo = {
    brand_id: number | null;
    model: number | null;
    year: number | null;
    tipoInspeccion: number | null;
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
    brand_id: number;
    name: string;
    logo: string;
    year_from: number;
    year_to: number;
};

export type InspectionItem = {
    id: number;
    inspection_id: number;
    label: string;
};

export type Inspection = {
    id: number;
    type: "LEGAL" | "BASIC" | "COMPLETE";
    title: string;
    description: string;
    price: number;
    items?: InspectionItem[];
};