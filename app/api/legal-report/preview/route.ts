import { NextRequest, NextResponse } from "next/server";
import { transformApiResponse } from "@/lib/pdf/legal/transform-api-response";

const INFORME_API_URL = "http://161.132.38.122/informe/placa";
const API_TIMEOUT_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { plate } = await req.json();

    if (!plate || typeof plate !== "string" || plate.replace(/-/g, "").length !== 6) {
      return NextResponse.json({ error: "Placa invalida" }, { status: 400 });
    }

    const cleanPlate = plate.toUpperCase().replace(/-/g, "");
    const apiKey = process.env.INFORME_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key no configurada" }, { status: 500 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const res = await fetch(INFORME_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({ placa: cleanPlate }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`API respondio ${res.status}: ${body}`);
      }

      const apiData = await res.json();
      const data = transformApiResponse(apiData, cleanPlate);

      return NextResponse.json({
        vehicle: {
          marca: apiData.vehiculo?.marca || "",
          modelo: apiData.vehiculo?.modelo || "",
          anio: apiData.vehiculo?.anio_modelo || "",
          color: apiData.vehiculo?.color || "",
          combustible: apiData.vehiculo?.combustible || "",
          uso: apiData.vehiculo?.uso || "",
        },
        fields: data.fields,
        owners: data.owners,
        conclusionLabel: apiData.conclusion?.etiqueta || "",
        apiData,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("Error en preview:", error);
    return NextResponse.json({ error: "Error consultando la placa" }, { status: 500 });
  }
}
