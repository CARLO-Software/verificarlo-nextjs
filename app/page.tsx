import Hero from "./landing/hero/Hero";
import ProcessSection from "./landing/processSection/ProcessSection";
import ServicesSection from "./landing/servicesSection/ServicesSection";
import RiesgosSection from "./landing/riesgos_miles_soles/RiesgosSection";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import MetricasSection from "./landing/metricas/MetricasSection";
import GoogleReviews from "./landing/googleReviews/GoogleReviews";
import BlogSection from "./landing/blogSection/BlogSection";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const role = session.user.role;
    const redirectMap: Record<string, string> = {
      ADMIN: "/admin",
      INSPECTOR: "/inspector",
    };
    redirect(redirectMap[role] || "/perfil");
  }

  return (
    <>
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <main id="main-content">
        {/*Hero section */}
        <Hero />

        {/* Services section -> Aqui deben de estar los planes*/}
        <ServicesSection />

        {/* Process section */}
        <ProcessSection />

        {/* TODO: Metricas */}
        <MetricasSection />

        {/* Google Reviews - Carrusel infinito de testimonios */}
        <GoogleReviews />

        {/* TODO: Riesgos que pueden costar miles */}
        <RiesgosSection />

        {/* Blog Section */}
        <BlogSection />

        {/*Benefits section */}
        {/* <BenefitsSection /> */}

        {/*EligeTranquiloSection*/}
        {/* <EligeTranquiloSection /> */}

        {/*Centro de inspección */}
        {/* <CentroInspeccionSection /> */}

        {/* FAQ section */}
        {/* <FAQ /> */}
      </main>
    </>
  );
}
