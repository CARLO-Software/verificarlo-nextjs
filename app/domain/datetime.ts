export function convertirBogotaALocalUTC(fecha: string, hora: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);

  // Bogotá/Lima = UTC-5
  return new Date(Date.UTC(y, m - 1, d, h , min));
}