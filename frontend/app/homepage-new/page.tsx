'use client';

import { HeroSection } from './sections/HeroSection';
import { QuickSearchSection } from './sections/QuickSearchSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { SpecialtiesSection } from './sections/SpecialtiesSection';
import { TopDoctorsSection } from './sections/TopDoctorsSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { FAQSection } from './sections/FAQSection';
import { CTASection } from './sections/CTASection';
import { Footer } from './sections/Footer';
import { Navbar } from './sections/Navbar';

export default function NewHomePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900">
      <Navbar />
      <main>
        <HeroSection />
        <QuickSearchSection />
        <HowItWorksSection />
        <FeaturesSection />
        <SpecialtiesSection />
        <TopDoctorsSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
