import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const syncSecret = process.env.CARLO_SYNC_SECRET;
  const authHeader = req.headers.get("x-sync-secret");

  if (!syncSecret || authHeader !== syncSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const inspectors = await db.user.findMany({
    where: { role: "INSPECTOR", status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isInspectorAvailable: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ inspectors });
}
