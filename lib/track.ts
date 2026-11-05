type Data = Record<string, unknown>;

function dl(): Data[] {
  const w = window as unknown as { dataLayer?: Data[] };
  w.dataLayer = w.dataLayer || [];
  return w.dataLayer;
}

export function track(event: string, data: Data = {}) {
  if (typeof window === "undefined") return;
  dl().push({ event, ...data });
}

export function trackEcommerce(event: string, ecommerce: Data, extra: Data = {}) {
  if (typeof window === "undefined") return;
  dl().push({ ecommerce: null });
  dl().push({ event, ...extra, ecommerce });
}

export function trackPurchase(
  id: string,
  producto: "reporte_legal" | "reserva_inspeccion",
  value: number,
  item: Record<string, unknown>,
) {
  const key = "purchase_" + id;
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  trackEcommerce("purchase", { transaction_id: id, currency: "PEN", value, items: [item] }, { producto });
}
