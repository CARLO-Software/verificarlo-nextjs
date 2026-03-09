// =============================================================================
// LISTA DE DISTRITOS DE LIMA METROPOLITANA
// =============================================================================
// Este archivo contiene los distritos donde Verificarlo ofrece servicio a domicilio.
// Los distritos están ordenados alfabéticamente para facilitar la búsqueda.
//
// CONCEPTO: Separar datos en archivos dedicados permite:
// - Reutilizar en múltiples componentes
// - Modificar sin tocar la lógica de negocio
// - Facilitar testing con datos mock
// =============================================================================

export interface District {
  id: number;
  name: string;
  zone: "lima-centro" | "lima-norte" | "lima-sur" | "lima-este" | "callao";
}

// Lista de distritos de Lima Metropolitana donde opera Verificarlo
export const limaDistricts: District[] = [
  // Lima Centro
  { id: 1, name: "Barranco", zone: "lima-centro" },
  { id: 2, name: "Breña", zone: "lima-centro" },
  { id: 3, name: "Jesús María", zone: "lima-centro" },
  { id: 4, name: "La Victoria", zone: "lima-centro" },
  { id: 5, name: "Lima (Cercado)", zone: "lima-centro" },
  { id: 6, name: "Lince", zone: "lima-centro" },
  { id: 7, name: "Magdalena del Mar", zone: "lima-centro" },
  { id: 8, name: "Miraflores", zone: "lima-centro" },
  { id: 9, name: "Pueblo Libre", zone: "lima-centro" },
  { id: 10, name: "Rímac", zone: "lima-centro" },
  { id: 11, name: "San Borja", zone: "lima-centro" },
  { id: 12, name: "San Isidro", zone: "lima-centro" },
  { id: 13, name: "San Miguel", zone: "lima-centro" },
  { id: 14, name: "Santiago de Surco", zone: "lima-centro" },
  { id: 15, name: "Surquillo", zone: "lima-centro" },

  // Lima Norte
  { id: 16, name: "Ancón", zone: "lima-norte" },
  { id: 17, name: "Carabayllo", zone: "lima-norte" },
  { id: 18, name: "Comas", zone: "lima-norte" },
  { id: 19, name: "Independencia", zone: "lima-norte" },
  { id: 20, name: "Los Olivos", zone: "lima-norte" },
  { id: 21, name: "Puente Piedra", zone: "lima-norte" },
  { id: 22, name: "San Martín de Porres", zone: "lima-norte" },
  { id: 23, name: "Santa Rosa", zone: "lima-norte" },

  // Lima Sur
  { id: 24, name: "Chorrillos", zone: "lima-sur" },
  { id: 25, name: "Lurín", zone: "lima-sur" },
  { id: 26, name: "Pachacámac", zone: "lima-sur" },
  { id: 27, name: "Pucusana", zone: "lima-sur" },
  { id: 28, name: "Punta Hermosa", zone: "lima-sur" },
  { id: 29, name: "Punta Negra", zone: "lima-sur" },
  { id: 30, name: "San Bartolo", zone: "lima-sur" },
  { id: 31, name: "San Juan de Miraflores", zone: "lima-sur" },
  { id: 32, name: "Santa María del Mar", zone: "lima-sur" },
  { id: 33, name: "Villa El Salvador", zone: "lima-sur" },
  { id: 34, name: "Villa María del Triunfo", zone: "lima-sur" },

  // Lima Este
  { id: 35, name: "Ate", zone: "lima-este" },
  { id: 36, name: "Chaclacayo", zone: "lima-este" },
  { id: 37, name: "Cieneguilla", zone: "lima-este" },
  { id: 38, name: "El Agustino", zone: "lima-este" },
  { id: 39, name: "La Molina", zone: "lima-este" },
  { id: 40, name: "Lurigancho-Chosica", zone: "lima-este" },
  { id: 41, name: "San Juan de Lurigancho", zone: "lima-este" },
  { id: 42, name: "San Luis", zone: "lima-este" },
  { id: 43, name: "Santa Anita", zone: "lima-este" },

  // Callao
  { id: 44, name: "Bellavista", zone: "callao" },
  { id: 45, name: "Callao (Cercado)", zone: "callao" },
  { id: 46, name: "Carmen de la Legua Reynoso", zone: "callao" },
  { id: 47, name: "La Perla", zone: "callao" },
  { id: 48, name: "La Punta", zone: "callao" },
  { id: 49, name: "Mi Perú", zone: "callao" },
  { id: 50, name: "Ventanilla", zone: "callao" },
];

// Helper: Obtener distritos ordenados alfabéticamente
export const getDistrictsSorted = (): District[] => {
  return [...limaDistricts].sort((a, b) => a.name.localeCompare(b.name, "es"));
};

// Helper: Obtener distritos por zona
export const getDistrictsByZone = (zone: District["zone"]): District[] => {
  return limaDistricts.filter((d) => d.zone === zone);
};

// Helper: Buscar distrito por nombre (para autocomplete)
export const searchDistricts = (query: string): District[] => {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return getDistrictsSorted();

  return limaDistricts
    .filter((d) => d.name.toLowerCase().includes(normalized))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
};
