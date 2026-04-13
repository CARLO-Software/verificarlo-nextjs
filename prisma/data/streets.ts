// =============================================================================
// LISTA DE AVENIDAS/CALLES PRINCIPALES POR DISTRITO
// =============================================================================
// Este archivo contiene las avenidas y calles principales de cada distrito
// para el autocompletado de direcciones en el formulario de reserva.
// =============================================================================

export interface Street {
  name: string;
  type: "avenida" | "calle" | "jiron" | "pasaje" | "alameda" | "malecon";
}

// Mapeo de ID de distrito a sus calles principales
export const streetsByDistrict: Record<number, Street[]> = {
  // Lima Centro
  1: [ // Barranco
    { name: "Av. Grau", type: "avenida" },
    { name: "Av. San Martín", type: "avenida" },
    { name: "Av. Pedro de Osma", type: "avenida" },
    { name: "Av. El Sol", type: "avenida" },
    { name: "Av. Bolognesi", type: "avenida" },
    { name: "Jr. Unión", type: "jiron" },
    { name: "Calle San Martín", type: "calle" },
    { name: "Malecón Souza", type: "malecon" },
    { name: "Bajada de Baños", type: "calle" },
  ],
  2: [ // Breña
    { name: "Av. Venezuela", type: "avenida" },
    { name: "Av. Alfonso Ugarte", type: "avenida" },
    { name: "Av. Arica", type: "avenida" },
    { name: "Av. Bolivia", type: "avenida" },
    { name: "Jr. Huaraz", type: "jiron" },
    { name: "Jr. Aguarico", type: "jiron" },
    { name: "Jr. Centenario", type: "jiron" },
  ],
  3: [ // Jesús María
    { name: "Av. Brasil", type: "avenida" },
    { name: "Av. Salaverry", type: "avenida" },
    { name: "Av. San Felipe", type: "avenida" },
    { name: "Av. Cuba", type: "avenida" },
    { name: "Av. Arnaldo Márquez", type: "avenida" },
    { name: "Av. Gregorio Escobedo", type: "avenida" },
    { name: "Jr. Huiracocha", type: "jiron" },
    { name: "Calle Manco Cápac", type: "calle" },
  ],
  4: [ // La Victoria
    { name: "Av. Canadá", type: "avenida" },
    { name: "Av. México", type: "avenida" },
    { name: "Av. Iquitos", type: "avenida" },
    { name: "Av. Nicolás Arriola", type: "avenida" },
    { name: "Av. Manco Cápac", type: "avenida" },
    { name: "Av. 28 de Julio", type: "avenida" },
    { name: "Av. Aviación", type: "avenida" },
    { name: "Jr. Hipólito Unanue", type: "jiron" },
  ],
  5: [ // Lima (Cercado)
    { name: "Av. Abancay", type: "avenida" },
    { name: "Av. Tacna", type: "avenida" },
    { name: "Av. Alfonso Ugarte", type: "avenida" },
    { name: "Av. Grau", type: "avenida" },
    { name: "Av. Nicolás de Piérola", type: "avenida" },
    { name: "Av. Emancipación", type: "avenida" },
    { name: "Jr. de la Unión", type: "jiron" },
    { name: "Jr. Camaná", type: "jiron" },
    { name: "Jr. Lampa", type: "jiron" },
    { name: "Jr. Cusco", type: "jiron" },
  ],
  6: [ // Lince
    { name: "Av. Arequipa", type: "avenida" },
    { name: "Av. César Vallejo", type: "avenida" },
    { name: "Av. Arenales", type: "avenida" },
    { name: "Av. Ignacio Merino", type: "avenida" },
    { name: "Av. Prolongación Iquitos", type: "avenida" },
    { name: "Calle Risso", type: "calle" },
    { name: "Jr. Francisco de Zela", type: "jiron" },
  ],
  7: [ // Magdalena del Mar
    { name: "Av. Brasil", type: "avenida" },
    { name: "Av. Javier Prado Oeste", type: "avenida" },
    { name: "Av. Sucre", type: "avenida" },
    { name: "Av. Juan de Aliaga", type: "avenida" },
    { name: "Jr. Castilla", type: "jiron" },
    { name: "Malecón Grau", type: "malecon" },
  ],
  8: [ // Miraflores
    { name: "Av. Larco", type: "avenida" },
    { name: "Av. Pardo", type: "avenida" },
    { name: "Av. Arequipa", type: "avenida" },
    { name: "Av. Benavides", type: "avenida" },
    { name: "Av. Comandante Espinar", type: "avenida" },
    { name: "Av. Angamos", type: "avenida" },
    { name: "Av. Ricardo Palma", type: "avenida" },
    { name: "Av. Diagonal", type: "avenida" },
    { name: "Av. 28 de Julio", type: "avenida" },
    { name: "Calle Schell", type: "calle" },
    { name: "Calle Berlín", type: "calle" },
    { name: "Malecón Cisneros", type: "malecon" },
    { name: "Malecón de la Reserva", type: "malecon" },
  ],
  9: [ // Pueblo Libre
    { name: "Av. Brasil", type: "avenida" },
    { name: "Av. Bolívar", type: "avenida" },
    { name: "Av. Sucre", type: "avenida" },
    { name: "Av. La Marina", type: "avenida" },
    { name: "Av. Del Río", type: "avenida" },
    { name: "Jr. Manuel Cipriano Dulanto", type: "jiron" },
  ],
  10: [ // Rímac
    { name: "Av. Alcázar", type: "avenida" },
    { name: "Av. Francisco Pizarro", type: "avenida" },
    { name: "Av. Amancaes", type: "avenida" },
    { name: "Av. Pizarro", type: "avenida" },
    { name: "Jr. Trujillo", type: "jiron" },
    { name: "Jr. Chiclayo", type: "jiron" },
    { name: "Alameda de los Descalzos", type: "alameda" },
  ],
  11: [ // San Borja
    { name: "Av. San Borja Norte", type: "avenida" },
    { name: "Av. San Borja Sur", type: "avenida" },
    { name: "Av. Javier Prado Este", type: "avenida" },
    { name: "Av. San Luis", type: "avenida" },
    { name: "Av. Aviación", type: "avenida" },
    { name: "Av. Angamos Este", type: "avenida" },
    { name: "Av. Boulevard de Surco", type: "avenida" },
    { name: "Calle Las Letras", type: "calle" },
    { name: "Calle Los Tucanes", type: "calle" },
  ],
  12: [ // San Isidro
    { name: "Av. Javier Prado", type: "avenida" },
    { name: "Av. Arequipa", type: "avenida" },
    { name: "Av. Camino Real", type: "avenida" },
    { name: "Av. Conquistadores", type: "avenida" },
    { name: "Av. Rivera Navarrete", type: "avenida" },
    { name: "Av. Juan de Arona", type: "avenida" },
    { name: "Av. Canaval y Moreyra", type: "avenida" },
    { name: "Av. Paz Soldán", type: "avenida" },
    { name: "Calle Las Begonias", type: "calle" },
    { name: "Calle Los Eucaliptos", type: "calle" },
    { name: "Calle Chinchón", type: "calle" },
  ],
  13: [ // San Miguel
    { name: "Av. La Marina", type: "avenida" },
    { name: "Av. Universitaria", type: "avenida" },
    { name: "Av. Elmer Faucett", type: "avenida" },
    { name: "Av. Venezuela", type: "avenida" },
    { name: "Av. Costanera", type: "avenida" },
    { name: "Av. La Paz", type: "avenida" },
    { name: "Jr. Federico Gallese", type: "jiron" },
  ],
  14: [ // Santiago de Surco
    { name: "Av. Javier Prado Este", type: "avenida" },
    { name: "Av. Primavera", type: "avenida" },
    { name: "Av. El Polo", type: "avenida" },
    { name: "Av. Caminos del Inca", type: "avenida" },
    { name: "Av. Benavides", type: "avenida" },
    { name: "Av. Tomás Marsano", type: "avenida" },
    { name: "Av. Velasco Astete", type: "avenida" },
    { name: "Av. Santiago de Surco", type: "avenida" },
    { name: "Av. Monte de los Olivos", type: "avenida" },
    { name: "Av. Guardia Civil", type: "avenida" },
    { name: "Calle Monte Rosa", type: "calle" },
    { name: "Calle Monterrey", type: "calle" },
  ],
  15: [ // Surquillo
    { name: "Av. Angamos", type: "avenida" },
    { name: "Av. Tomás Marsano", type: "avenida" },
    { name: "Av. República de Panamá", type: "avenida" },
    { name: "Av. Aviación", type: "avenida" },
    { name: "Av. Paseo de la República", type: "avenida" },
    { name: "Jr. Dante", type: "jiron" },
    { name: "Calle San Pedro", type: "calle" },
  ],

  // Lima Norte
  16: [ // Ancón
    { name: "Av. Panamericana Norte", type: "avenida" },
    { name: "Malecón Ferreyros", type: "malecon" },
    { name: "Jr. Atahualpa", type: "jiron" },
  ],
  17: [ // Carabayllo
    { name: "Av. Túpac Amaru", type: "avenida" },
    { name: "Av. San Juan Bautista", type: "avenida" },
    { name: "Av. Isabel Chimpu Ocllo", type: "avenida" },
    { name: "Av. Universitaria Norte", type: "avenida" },
  ],
  18: [ // Comas
    { name: "Av. Túpac Amaru", type: "avenida" },
    { name: "Av. Universitaria Norte", type: "avenida" },
    { name: "Av. México", type: "avenida" },
    { name: "Av. Revolución", type: "avenida" },
    { name: "Av. Puno", type: "avenida" },
    { name: "Av. Micaela Bastidas", type: "avenida" },
  ],
  19: [ // Independencia
    { name: "Av. Túpac Amaru", type: "avenida" },
    { name: "Av. Carlos Izaguirre", type: "avenida" },
    { name: "Av. Tomás Valle", type: "avenida" },
    { name: "Av. Chinchaysuyo", type: "avenida" },
    { name: "Av. Industrial", type: "avenida" },
  ],
  20: [ // Los Olivos
    { name: "Av. Universitaria Norte", type: "avenida" },
    { name: "Av. Carlos Izaguirre", type: "avenida" },
    { name: "Av. Palmeras", type: "avenida" },
    { name: "Av. Naranjal", type: "avenida" },
    { name: "Av. Antúnez de Mayolo", type: "avenida" },
    { name: "Av. Alfredo Mendiola", type: "avenida" },
    { name: "Av. Las Palmeras", type: "avenida" },
    { name: "Calle Los Alisos", type: "calle" },
  ],
  21: [ // Puente Piedra
    { name: "Av. Panamericana Norte", type: "avenida" },
    { name: "Av. San Lorenzo", type: "avenida" },
    { name: "Av. Lecaros", type: "avenida" },
    { name: "Av. Juan Lecaros", type: "avenida" },
  ],
  22: [ // San Martín de Porres
    { name: "Av. Perú", type: "avenida" },
    { name: "Av. Universitaria Norte", type: "avenida" },
    { name: "Av. Canta Callao", type: "avenida" },
    { name: "Av. Tomas Valle", type: "avenida" },
    { name: "Av. Habich", type: "avenida" },
    { name: "Av. Pacasmayo", type: "avenida" },
    { name: "Av. Carlos Izaguirre", type: "avenida" },
    { name: "Jr. Contisuyo", type: "jiron" },
  ],
  23: [ // Santa Rosa
    { name: "Av. Panamericana Norte", type: "avenida" },
    { name: "Malecón", type: "malecon" },
  ],

  // Lima Sur
  24: [ // Chorrillos
    { name: "Av. Defensores del Morro", type: "avenida" },
    { name: "Av. Huaylas", type: "avenida" },
    { name: "Av. Guardia Civil", type: "avenida" },
    { name: "Av. Alameda Sur", type: "avenida" },
    { name: "Av. Paseo de la República", type: "avenida" },
    { name: "Av. Escuela Militar", type: "avenida" },
    { name: "Malecón Grau", type: "malecon" },
  ],
  25: [ // Lurín
    { name: "Av. Panamericana Sur", type: "avenida" },
    { name: "Antigua Panamericana Sur", type: "avenida" },
    { name: "Av. San Pedro", type: "avenida" },
    { name: "Av. Paul Poblet", type: "avenida" },
  ],
  26: [ // Pachacámac
    { name: "Av. Paul Poblet", type: "avenida" },
    { name: "Av. Víctor Malásquez", type: "avenida" },
    { name: "Av. Manuel Valle", type: "avenida" },
  ],
  27: [ // Pucusana
    { name: "Av. Lima", type: "avenida" },
    { name: "Malecón San Martín", type: "malecon" },
  ],
  28: [ // Punta Hermosa
    { name: "Av. Panamericana Sur", type: "avenida" },
    { name: "Av. Costa Azul", type: "avenida" },
    { name: "Malecón Central", type: "malecon" },
  ],
  29: [ // Punta Negra
    { name: "Av. Panamericana Sur", type: "avenida" },
    { name: "Av. Costa Sur", type: "avenida" },
  ],
  30: [ // San Bartolo
    { name: "Av. Panamericana Sur", type: "avenida" },
    { name: "Av. San Bartolo", type: "avenida" },
  ],
  31: [ // San Juan de Miraflores
    { name: "Av. Los Héroes", type: "avenida" },
    { name: "Av. San Juan", type: "avenida" },
    { name: "Av. Pedro Miotta", type: "avenida" },
    { name: "Av. Vargas Machuca", type: "avenida" },
    { name: "Av. Billinghurst", type: "avenida" },
    { name: "Av. César Canevaro", type: "avenida" },
  ],
  32: [ // Santa María del Mar
    { name: "Av. Panamericana Sur", type: "avenida" },
    { name: "Malecón", type: "malecon" },
  ],
  33: [ // Villa El Salvador
    { name: "Av. Pachacútec", type: "avenida" },
    { name: "Av. El Sol", type: "avenida" },
    { name: "Av. 200 Millas", type: "avenida" },
    { name: "Av. Revolución", type: "avenida" },
    { name: "Av. Central", type: "avenida" },
    { name: "Av. Juan Velasco Alvarado", type: "avenida" },
  ],
  34: [ // Villa María del Triunfo
    { name: "Av. Pachacútec", type: "avenida" },
    { name: "Av. 26 de Noviembre", type: "avenida" },
    { name: "Av. Salvador Allende", type: "avenida" },
    { name: "Av. El Triunfo", type: "avenida" },
    { name: "Av. Villa María", type: "avenida" },
  ],

  // Lima Este
  35: [ // Ate
    { name: "Av. Nicolás Ayllón", type: "avenida" },
    { name: "Av. La Molina", type: "avenida" },
    { name: "Av. Separadora Industrial", type: "avenida" },
    { name: "Av. Los Frutales", type: "avenida" },
    { name: "Av. Metropolitana", type: "avenida" },
    { name: "Carretera Central", type: "avenida" },
    { name: "Av. Huarochirí", type: "avenida" },
  ],
  36: [ // Chaclacayo
    { name: "Carretera Central", type: "avenida" },
    { name: "Av. Nicolás Ayllón", type: "avenida" },
    { name: "Av. Wiracocha", type: "avenida" },
  ],
  37: [ // Cieneguilla
    { name: "Av. Nueva Toledo", type: "avenida" },
    { name: "Av. La Molina", type: "avenida" },
  ],
  38: [ // El Agustino
    { name: "Av. Riva Agüero", type: "avenida" },
    { name: "Av. Ancash", type: "avenida" },
    { name: "Av. Ferrocarril", type: "avenida" },
    { name: "Av. José Carlos Mariátegui", type: "avenida" },
  ],
  39: [ // La Molina
    { name: "Av. Javier Prado Este", type: "avenida" },
    { name: "Av. La Molina", type: "avenida" },
    { name: "Av. La Fontana", type: "avenida" },
    { name: "Av. Raúl Ferrero", type: "avenida" },
    { name: "Av. El Corregidor", type: "avenida" },
    { name: "Av. Los Fresnos", type: "avenida" },
    { name: "Av. Separadora Industrial", type: "avenida" },
    { name: "Calle Los Castaños", type: "calle" },
    { name: "Calle El Sauce", type: "calle" },
  ],
  40: [ // Lurigancho-Chosica
    { name: "Carretera Central", type: "avenida" },
    { name: "Av. Lima", type: "avenida" },
    { name: "Av. 28 de Julio", type: "avenida" },
    { name: "Av. Túpac Amaru", type: "avenida" },
  ],
  41: [ // San Juan de Lurigancho
    { name: "Av. Próceres de la Independencia", type: "avenida" },
    { name: "Av. Canto Grande", type: "avenida" },
    { name: "Av. El Sol", type: "avenida" },
    { name: "Av. Gran Chimú", type: "avenida" },
    { name: "Av. Fernando Wiesse", type: "avenida" },
    { name: "Av. Lurigancho", type: "avenida" },
    { name: "Av. Las Flores", type: "avenida" },
    { name: "Av. Lima", type: "avenida" },
  ],
  42: [ // San Luis
    { name: "Av. Nicolás Arriola", type: "avenida" },
    { name: "Av. San Luis", type: "avenida" },
    { name: "Av. Circunvalación", type: "avenida" },
    { name: "Av. Rosa Toro", type: "avenida" },
  ],
  43: [ // Santa Anita
    { name: "Av. Los Ruiseñores", type: "avenida" },
    { name: "Carretera Central", type: "avenida" },
    { name: "Av. Huarochirí", type: "avenida" },
    { name: "Av. Metropolitana", type: "avenida" },
    { name: "Av. Santa Rosa", type: "avenida" },
  ],

  // Callao
  44: [ // Bellavista
    { name: "Av. Venezuela", type: "avenida" },
    { name: "Av. Colonial", type: "avenida" },
    { name: "Av. Faucett", type: "avenida" },
    { name: "Av. Oscar R. Benavides", type: "avenida" },
  ],
  45: [ // Callao (Cercado)
    { name: "Av. Sáenz Peña", type: "avenida" },
    { name: "Av. Miguel Grau", type: "avenida" },
    { name: "Av. Buenos Aires", type: "avenida" },
    { name: "Av. Argentina", type: "avenida" },
    { name: "Av. Colonial", type: "avenida" },
    { name: "Jr. Constitución", type: "jiron" },
  ],
  46: [ // Carmen de la Legua Reynoso
    { name: "Av. Colonial", type: "avenida" },
    { name: "Av. Argentina", type: "avenida" },
    { name: "Av. Morales Duárez", type: "avenida" },
  ],
  47: [ // La Perla
    { name: "Av. Costanera", type: "avenida" },
    { name: "Av. Santa Rosa", type: "avenida" },
    { name: "Av. Venezuela", type: "avenida" },
    { name: "Av. La Paz", type: "avenida" },
  ],
  48: [ // La Punta
    { name: "Av. Grau", type: "avenida" },
    { name: "Malecón Pardo", type: "malecon" },
    { name: "Malecón Wiese", type: "malecon" },
  ],
  49: [ // Mi Perú
    { name: "Av. Néstor Gambetta", type: "avenida" },
    { name: "Av. Central", type: "avenida" },
  ],
  50: [ // Ventanilla
    { name: "Av. Néstor Gambetta", type: "avenida" },
    { name: "Av. Pedro Beltrán", type: "avenida" },
    { name: "Av. La Playa", type: "avenida" },
    { name: "Av. Revolución", type: "avenida" },
  ],
};

// Helper: Obtener calles de un distrito por ID
export const getStreetsByDistrictId = (districtId: number): Street[] => {
  return streetsByDistrict[districtId] || [];
};

// Helper: Buscar calles en un distrito
export const searchStreets = (districtId: number, query: string): Street[] => {
  const streets = getStreetsByDistrictId(districtId);
  if (!query.trim()) return streets;

  const normalized = query.toLowerCase().trim();
  return streets.filter((s) =>
    s.name.toLowerCase().includes(normalized)
  );
};

// Helper: Formatear nombre completo de calle
export const formatStreetName = (street: Street): string => {
  return street.name;
};
