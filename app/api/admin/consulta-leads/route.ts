import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const leads = await db.consultaLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const total = await db.consultaLead.count();
  const verified = await db.consultaLead.count({ where: { verified: true } });

  return NextResponse.json({ leads, total, verified });
}
