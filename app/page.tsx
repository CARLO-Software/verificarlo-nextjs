"use client"
import FAQ from "./components/FAQ/FAQ";
import WhatsappFlotante from "./components/WhatsappFlotante/WhatsappFlotante";
import Footer from "./components/Footer/Footer";
import Hero from "./components/Hero/Hero";
import ProcessSection from "./components/ProcessSection/ProcessSection";
import ServicesSection from "./components/ServicesSection/ServicesSection";
import EligeTranquiloSection from "./components/EligeTranquilo/EligeTranquiloSection";
import CentroInspeccionSection from "./components/CentroInspeccion/CentroInspeccionSection";
import BenefitsSection from "./components/Benefits/BenefitsSection";

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
