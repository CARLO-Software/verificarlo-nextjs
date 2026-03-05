import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | VerifiCARLO - Consejos para comprar autos usados",
  description:
    "Consejos, guías y alertas para comprar tu auto usado con seguridad. Aprende a identificar problemas, evitar estafas y tomar mejores decisiones.",
  openGraph: {
    title: "Blog | VerifiCARLO",
    description:
      "Consejos, guías y alertas para comprar tu auto usado con seguridad.",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
