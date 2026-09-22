import DemoHero from "./DemoHero";
import DemoClient from "./DemoClient";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ placa?: string }>;
}) {
  const { placa } = await searchParams;

  if (!placa) return <DemoHero />;

  return <DemoClient initialPlaca={placa.toUpperCase()} />;
}
