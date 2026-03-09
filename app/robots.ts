import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://verificarlo.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/inspector/",
          "/perfil/",
          "/api/",
          "/mis-inspecciones/",
          "/_next/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/inspector/", "/perfil/", "/api/", "/mis-inspecciones/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
