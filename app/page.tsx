"use client"
import Hero from "./landing/hero/Hero";
import ProcessSection from "./landing/processSection/ProcessSection";
import ServicesSection from "./landing/servicesSection/ServicesSection";
import BenefitsSection from "./landing/benefits/BenefitsSection";
import EligeTranquiloSection from "./landing/eligeTranquilo/EligeTranquiloSection";
import CentroInspeccionSection from "./landing/centroInspeccion/CentroInspeccionSection";
import FAQ from "./landing/faq/FAQ";


export default function Home() {

  return (
    <>

      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <main id="main-content">
        {/*Hero section */}
        <Hero />

        {/* Process section */}
        <ProcessSection />

        {/* Services section */}
        <ServicesSection />

        {/*Benefits section */}
        <BenefitsSection />

        {/*EligeTranquiloSection*/}
        <EligeTranquiloSection />

        {/*Centro de inspección */}
        <CentroInspeccionSection />

        {/* FAQ section */}
        <FAQ />
      </main>
    </>
  );
}
