// Componentes de datos estructurados JSON-LD para SEO
// Estos schemas ayudan a Google a entender mejor el contenido

// Schema de Negocio Local - Aparece en Google Maps y panel de conocimiento
export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: "VerifiCARLO",
    description:
      "Servicio de inspección de autos usados en Lima. Revisamos más de 200 puntos en mecánica, estética y documentación legal antes de tu compra.",
    url: "https://verificarlo.pe",
    logo: "https://verificarlo.pe/assets/images/verificarlo-logo.png",
    image: "https://verificarlo.pe/assets/images/image0.png",
    telephone: "+51934140010", // TODO: Reemplazar con número real
    email: "verificarlo@carlo.pe", // TODO: Reemplazar con email real
    address: {
      "@type": "PostalAddress",
      streetAddress: "Cerro Azul 421, Santiago de Surco, Lima", // TODO: Agregar dirección específica
      addressLocality: "Lima",
      addressRegion: "Lima",
      postalCode: "15000",
      addressCountry: "PE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -12.0464, // Coordenadas de Lima
      longitude: -77.0428,
    },
    areaServed: {
      "@type": "City",
      name: "Lima",
      "@id": "https://www.wikidata.org/wiki/Q2868",
    },
    priceRange: "S/249 - S/499",
    currenciesAccepted: "PEN",
    paymentAccepted: "Efectivo, Tarjeta de crédito, Yape, Plin",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "14:00",
      },
    ],
    sameAs: [
      "https://www.facebook.com/verificarlo", // TODO: URLs reales
      "https://www.instagram.com/verificarlo",
      "https://www.tiktok.com/@verificarlo",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Schema de Sitio Web - Habilita la barra de búsqueda en Google
export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VerifiCARLO",
    url: "https://verificarlo.pe",
    description:
      "Inspección profesional de autos usados en Lima, Perú. Evita fraudes y compra con confianza.",
    publisher: {
      "@type": "Organization",
      name: "VerifiCARLO",
      logo: {
        "@type": "ImageObject",
        url: "https://verificarlo.pe/assets/images/verificarlo-logo.png",
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://verificarlo.pe/blog?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Schema de Servicio - Describe los servicios ofrecidos
export function ServiceSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Inspección Vehicular",
    name: "Inspección de Autos Usados",
    description:
      "Servicio completo de inspección vehicular que incluye revisión mecánica, estética, eléctrica y verificación de documentos legales. Más de 200 puntos de inspección.",
    provider: {
      "@type": "LocalBusiness",
      name: "VerifiCARLO",
      url: "https://verificarlo.pe",
    },
    areaServed: {
      "@type": "City",
      name: "Lima",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Planes de Inspección",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Inspección Básica",
            description: "Revisión de 150+ puntos esenciales",
          },
          price: "249",
          priceCurrency: "PEN",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Inspección Completa",
            description: "Revisión de 200+ puntos con prueba de ruta",
          },
          price: "349",
          priceCurrency: "PEN",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Inspección Premium",
            description: "Inspección completa + verificación legal exhaustiva",
          },
          price: "499",
          priceCurrency: "PEN",
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Schema de FAQ - Aparece como preguntas expandibles en Google
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSchema({ faqs }: { faqs: FAQItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Schema de Artículo de Blog
interface BlogPostSchemaProps {
  title: string;
  description: string;
  slug: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  modifiedAt?: string;
}

export function BlogPostSchema({
  title,
  description,
  slug,
  coverImage,
  author,
  publishedAt,
  modifiedAt,
}: BlogPostSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: description,
    image: coverImage,
    url: `https://verificarlo.pe/blog/${slug}`,
    datePublished: publishedAt,
    dateModified: modifiedAt || publishedAt,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "VerifiCARLO",
      logo: {
        "@type": "ImageObject",
        url: "https://verificarlo.pe/assets/images/verificarlo-logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://verificarlo.pe/blog/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Schema de Breadcrumb - Mejora la navegación en resultados de búsqueda
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
