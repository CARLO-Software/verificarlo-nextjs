import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VerifiCARLO - Inspección de Autos Usados",
    short_name: "VerifiCARLO",
    description:
      "Inspecciona tu auto usado antes de comprarlo. Revisamos más de 200 puntos en mecánica, estética y legal. Servicio de inspección vehicular en Lima, Perú.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1E3A8A",
    orientation: "portrait",
    scope: "/",
    lang: "es-PE",
    categories: ["automotive", "business", "lifestyle"],
    icons: [
      {
        src: "/assets/images/image0.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/images/image0.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
