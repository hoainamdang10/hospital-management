"use client";

import Link from "next/link";

export default function WarmHumanPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Variation Switcher */}
      <div className="bg-neutral-900 text-white py-2 text-center text-sm">
        <span className="mr-4">Visual Variations:</span>
        <Link href="/" className="underline hover:no-underline mr-3">Clinical Minimal</Link>
        <Link href="/data-forward" className="underline hover:no-underline mr-3">Data-Forward</Link>
        <span className="font-bold">Warm Human</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs">
        <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-xl text-neutral-900">Hospital Management</div>
          <div className="flex gap-3">
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/book" className="btn-primary">Book now</Link>
          </div>
        </div>
      </header>

      {/* Hero - Photo-led */}
      <section className="py-20 bg-gradient-to-br from-brand/5 to-neutral-50">
        <div className="max-w-content mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-neutral-900 mb-4 leading-tight">
                Care that puts you first
              </h1>
              <p className="text-xl text-neutral-700 mb-8" style={{ lineHeight: 1.65 }}>
                We believe healthcare should be personal, accessible, and built around your needs—not the other way around.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/book" className="btn-primary">Schedule your visit</Link>
                <Link href="/about" className="btn-secondary">Meet our team</Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 pt-8 border-t border-neutral-200">
                <p className="text-sm text-neutral-600 mb-4">Trusted by families across Vietnam</p>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-bold text-brand">25K+</div>
                    <div className="text-sm text-neutral-600">Happy patients</div>
                  </div>
                  <div className="w-px h-12 bg-neutral-200"></div>
                  <div>
                    <div className="text-2xl font-bold text-brand">4.9/5</div>
                    <div className="text-sm text-neutral-600">Patient rating</div>
                  </div>
                  <div className="w-px h-12 bg-neutral-200"></div>
                  <div>
                    <div className="text-2xl font-bold text-brand">15 yrs</div>
                    <div className="text-sm text-neutral-600">Serving community</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo placeholder (documentary-style) */}
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-card overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-neutral-500">
                  [Documentary-style photo: Doctor consulting with patient, natural daylight, Vietnamese context]
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-accent-amber/90 text-white px-6 py-4 rounded-lg shadow-xs max-w-[240px]">
                <p className="text-sm font-medium">
                  "The doctors here really listen. I feel heard and cared for."
                </p>
                <p className="text-xs mt-2 opacity-90">— Trần Thị Mai, Patient</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo-led benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-content mx-auto px-6">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">Why families choose us</h2>
          <p className="text-lg text-neutral-600 mb-12">Real stories from real people</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Compassionate care",
                description: "Our doctors take time to understand your full story, not just your symptoms.",
                icon: "heart",
              },
              {
                title: "Family-friendly",
                description: "From pediatrics to elder care, we support every stage of your family's health journey.",
                icon: "users",
              },
              {
                title: "Always accessible",
                description: "Same-day appointments, 24/7 support, and online consultations when you need them.",
                icon: "phone",
              },
            ].map((benefit, i) => (
              <div key={i} className="bg-neutral-50 p-8 rounded-card">
                <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">{benefit.title}</h3>
                <p className="text-neutral-700" style={{ lineHeight: 1.65 }}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial spotlight */}
      <section className="py-20 bg-gradient-to-br from-brand/5 to-neutral-50">
        <div className="max-w-content mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-2xl font-medium text-neutral-900 mb-6" style={{ lineHeight: 1.65 }}>
              "After years of feeling dismissed by doctors, I finally found a team that treats me like a person, not a number. The difference is night and day."
            </blockquote>
            <footer>
              <cite className="not-italic font-semibold text-brand">Lê Văn Hùng</cite>
              <p className="text-neutral-600">Patient since 2020</p>
            </footer>
          </div>
        </div>
      </section>

      {/* Info banner (amber accent) */}
      <section className="py-4 bg-accent-amber/10 border-y border-accent-amber/20">
        <div className="max-w-content mx-auto px-6">
          <div className="flex items-center gap-4">
            <svg className="w-6 h-6 text-accent-amber flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-neutral-900">
              <strong>Open enrollment:</strong> New patients welcome. Most insurance accepted. Financial assistance available.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-content mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">Ready to experience better care?</h2>
          <p className="text-xl text-neutral-700 mb-8" style={{ lineHeight: 1.65 }}>
            Book your first appointment today. No referral needed.
          </p>
          <Link href="/book" className="btn-primary text-lg px-8">Get started</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-content mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-sm text-neutral-400">123 Le Loi Street<br />District 1, HCMC</p>
              <p className="text-sm text-neutral-400 mt-2">(028) 1234 5678</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Hours</h3>
              <p className="text-sm text-neutral-400">Mon-Fri: 7am-8pm<br />Sat-Sun: 8am-6pm<br />Emergency: 24/7</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/services" className="hover:text-white">Primary Care</Link></li>
                <li><Link href="/services" className="hover:text-white">Specialty Care</Link></li>
                <li><Link href="/services" className="hover:text-white">Urgent Care</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/faq" className="hover:text-white">FAQs</Link></li>
                <li><Link href="/insurance" className="hover:text-white">Insurance</Link></li>
                <li><Link href="/blog" className="hover:text-white">Health Blog</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-neutral-800 text-center text-sm text-neutral-400">
            <p>© 2024 Hospital Management. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
