import { redirect } from "next/navigation";
import ResultClient from "./ResultClient";

export default async function ConsultarPage({
  searchParams,
}: {
  searchParams: Promise<{ placa?: string }>;
}) {
  const { placa } = await searchParams;
  if (!placa) redirect("/");

  return <ResultClient initialPlaca={placa.toUpperCase()} />;
}
