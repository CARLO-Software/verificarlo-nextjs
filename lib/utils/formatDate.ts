/**
 * Formats a date string or Date object to a human-readable Spanish string.
 * e.g. "2025-06-15" → "15 de junio de 2025"
 */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Lima",
  });
}
