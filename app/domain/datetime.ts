const TIMEZONE_LIMA = 'America/Lima';

/**
 * Crea un Date sin conversión de zona horaria.
 * Si el usuario selecciona 12:00, se guarda 12:00 en la BD.
 */
export function crearFechaHoraSinConversion(fecha: string, hora: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);

  return new Date(Date.UTC(y, m - 1, d, h, min));
}

/**
 * Crea un Date solo con la fecha (hora 00:00:00 UTC)
 */
export function crearFechaSinConversion(fecha: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);

  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

/**
 * Suma minutos a una fecha
 */
export function sumarMinutos(fecha: Date, minutos: number): Date {
  return new Date(fecha.getTime() + minutos * 60 * 1000);
}

// ============================================
// FUNCIONES PARA MOSTRAR EN UI (UTC → Lima)
// ============================================

/**
 * Convierte una fecha UTC a string legible en hora de Lima
 * Ejemplo: "15 de enero de 2024, 12:30"
 */
export function formatearFechaHoraLima(fechaUtc: Date | string): string {
  const fecha = typeof fechaUtc === 'string' ? new Date(fechaUtc) : fechaUtc;

  return fecha.toLocaleString('es-PE', {
    timeZone: TIMEZONE_LIMA,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Convierte una fecha UTC a solo fecha en hora de Lima
 * Ejemplo: "15 de enero de 2024"
 */
export function formatearFechaLima(fechaUtc: Date | string): string {
  const fecha = typeof fechaUtc === 'string' ? new Date(fechaUtc) : fechaUtc;

  return fecha.toLocaleDateString('es-PE', {
    timeZone: TIMEZONE_LIMA,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Convierte una fecha UTC a solo hora en hora de Lima
 * Ejemplo: "12:30"
 */
export function formatearHoraLima(fechaUtc: Date | string): string {
  const fecha = typeof fechaUtc === 'string' ? new Date(fechaUtc) : fechaUtc;

  return fecha.toLocaleTimeString('es-PE', {
    timeZone: TIMEZONE_LIMA,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formato corto para tablas/listas
 * Ejemplo: "15/01/2024 12:30"
 */
export function formatearFechaHoraCorta(fechaUtc: Date | string): string {
  const fecha = typeof fechaUtc === 'string' ? new Date(fechaUtc) : fechaUtc;

  return fecha.toLocaleString('es-PE', {
    timeZone: TIMEZONE_LIMA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formato relativo: "Hace 5 minutos", "Hace 2 horas", etc.
 */
export function formatearTiempoRelativo(fechaUtc: Date | string): string {
  const fecha = typeof fechaUtc === 'string' ? new Date(fechaUtc) : fechaUtc;
  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
  if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;

  return formatearFechaLima(fecha);
}