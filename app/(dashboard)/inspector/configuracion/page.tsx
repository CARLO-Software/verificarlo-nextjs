import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChangePasswordSection } from "@/app/components/shared/ChangePasswordSection";

async function getUserHasPassword(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  return !!user?.password;
}

export default async function InspectorConfiguracionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Solo inspectores y admins pueden acceder
  if (session.user.role !== "INSPECTOR" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const hasPassword = await getUserHasPassword(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/inspector"
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">Configuración</h1>
            <p className="text-xs text-gray-500">Panel de Inspector</p>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ChangePasswordSection hasPassword={hasPassword} />
      </div>
    </div>
  );
}
