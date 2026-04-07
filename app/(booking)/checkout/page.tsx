import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  // Si no esta logueado, redirigir a login
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }

  // Obtener datos necesarios
  const [brands, inspectionPlans] = await Promise.all([
    db.brand.findMany({ orderBy: { name: "asc" } }),
    db.inspectionPlan.findMany({
      include: { items: true },
    }),
  ]);

  return (
    <CheckoutClient
      brands={brands}
      inspectionPlans={inspectionPlans}
      userEmail={session.user.email!}
      userName={session.user.name || ""}
    />
  );
}
