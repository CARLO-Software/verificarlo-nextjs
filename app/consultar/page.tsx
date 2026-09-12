import { redirect } from "next/navigation";
import ConsultarClient from "./ConsultarClient";

export default async function ConsultarPage({
  searchParams,
}: {
  searchParams: Promise<{ placa?: string }>;
}) {
  const { placa } = await searchParams;
  if (!placa) redirect("/");

  return <ConsultarClient placa={placa.toUpperCase()} />;
}
