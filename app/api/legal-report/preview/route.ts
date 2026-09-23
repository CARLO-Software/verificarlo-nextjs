import { NextRequest, NextResponse } from "next/server";

const FREE_CONSULTAR_URL = "http://161.132.38.122/free/consultar/placa";
const TIMEOUT_MS = 15 * 1000;
const MAX_RETRIES = 1;

async function fetchWithRetry(
  url: string,
  opts: RequestInit,
  timeoutMs: number,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      if (res.ok || attempt === retries) return res;
      if (res.status !== 503) return res;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Unreachable");
}

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

    const reqOpts = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
      body: JSON.stringify({ placa: cleanPlate }),
    };

    // consultar first
    const consultarRes = await fetchWithRetry(FREE_CONSULTAR_URL, reqOpts, TIMEOUT_MS);

    if (!consultarRes.ok) {
      const errBody = await consultarRes.text().catch(() => "");
      console.error(`API consultar ${consultarRes.status}: ${errBody}`);
      return NextResponse.json({ error: "No se pudo consultar la placa" }, { status: 502 });
    }

    const consultarData = await consultarRes.json();

    return NextResponse.json({
      consultar: consultarData,
      informe: null,
      plate: cleanPlate,
    });
  } catch (error) {
    console.error("Error en preview:", error);
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout
          ? "El servicio de consulta está tardando demasiado. Intenta de nuevo en unos segundos."
          : "Error consultando la placa" },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
