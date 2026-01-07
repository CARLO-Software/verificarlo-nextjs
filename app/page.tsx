"use client"
import FAQ from "./components/FAQ";
import WhatsappFlotante from "./components/WhatsappFlotante";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import PromotionalBanner from "./components/PromotionalBanner";
import ProcessSection from "./components/ProcessSection";
import ServicesSection from "./components/ServicesSection";
import EligeTranquiloSection from "./components/EligeTranquiloSection";
import CentroInspeccionSection from "./components/CentroInspeccionSection";
import BenefitsSection from "./components/BenefitsSection";

export default function Home() {

  return (
    <>

      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* Promotional banner */}
      <PromotionalBanner />

      {/* Main navigation */}
      <NavBar />

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

      {/*FOOTER */}
      <Footer />

      {/* Botón flotante de WhatsApp */}
      <WhatsappFlotante />
    </>
  );
}
