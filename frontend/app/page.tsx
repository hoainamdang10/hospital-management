import Link from "next/link";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BenefitsGrid } from "@/components/BenefitsGrid";
import { QuickActions } from "@/components/QuickActions";
import { FindDoctor } from "@/components/FindDoctor";
import { DepartmentsGrid } from "@/components/DepartmentsGrid";
import { Testimonials } from "@/components/Testimonials";
import { Insurance } from "@/components/Insurance";
import { CtaBand } from "@/components/CtaBand";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      {/* Variation Switcher */}
      <div className="bg-neutral-900 text-white py-2 text-center text-sm">
        <span className="mr-4">Visual Variations:</span>
        <span className="font-bold mr-3">Clinical Minimal</span>
        <Link href="/data-forward" className="underline hover:no-underline mr-3">Data-Forward</Link>
        <Link href="/warm-human" className="underline hover:no-underline">Warm Human</Link>
      </div>

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white">
        Skip to main content
      </a>
      
      <Header />
      
      <main id="main-content">
        <Hero />
        <BenefitsGrid />
        <QuickActions />
        <FindDoctor />
        <DepartmentsGrid />
        <Testimonials />
        <Insurance />
        <CtaBand />
      </main>
      
      <Footer />
    </>
  );
}
