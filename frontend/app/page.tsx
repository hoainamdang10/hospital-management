'use client';

import { HeroSection } from './homepage-new/sections/HeroSection';
import { QuickSearchSection } from './homepage-new/sections/QuickSearchSection';
import { HowItWorksSection } from './homepage-new/sections/HowItWorksSection';
import { FeaturesSection } from './homepage-new/sections/FeaturesSection';
import { SpecialtiesSection } from './homepage-new/sections/SpecialtiesSection';
import { TopDoctorsSection } from './homepage-new/sections/TopDoctorsSection';
import { TestimonialsSection } from './homepage-new/sections/TestimonialsSection';
import { FAQSection } from './homepage-new/sections/FAQSection';
import { CTASection } from './homepage-new/sections/CTASection';
import { Footer } from './homepage-new/sections/Footer';
import { Navbar } from './homepage-new/sections/Navbar';

export default function HomePage() {
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
