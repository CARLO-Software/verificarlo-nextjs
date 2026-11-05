import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes de Verificación",
  description:
    "Conoce nuestros planes de verificación vehicular: Reporte Legal, Inspección Básica e Inspección Premium. Desde S/19.90.",
  openGraph: {
    title: "Planes de Verificación - VerifiCARLO",
    description:
      "Asegura tu inversión con nuestros planes de verificación vehicular.",
    url: "https://www.verificarlo.com/planes",
  },
  alternates: {
    canonical: "/planes",
  },
};

export default function PlanesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
