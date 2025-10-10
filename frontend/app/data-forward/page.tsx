"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DataForwardPage() {
  const [stats, setStats] = useState({
    activeAppointments: 143,
    avgWaitTime: 12,
    doctorsOnline: 18,
    satisfactionRate: 97.2,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        activeAppointments: prev.activeAppointments + Math.floor(Math.random() * 3 - 1),
        avgWaitTime: Math.max(8, prev.avgWaitTime + Math.floor(Math.random() * 3 - 1)),
        doctorsOnline: Math.max(12, prev.doctorsOnline + Math.floor(Math.random() * 3 - 1)),
        satisfactionRate: prev.satisfactionRate,
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Variation Switcher */}
      <div className="bg-neutral-900 text-white py-2 text-center text-sm">
        <span className="mr-4">Visual Variations:</span>
        <Link href="/" className="underline hover:no-underline mr-3">Clinical Minimal</Link>
        <span className="font-bold mr-3">Data-Forward</span>
        <Link href="/warm-human" className="underline hover:no-underline">Warm Human</Link>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-xl">Hospital Management</div>
          <div className="flex gap-3">
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/book" className="btn-primary">Book now</Link>
          </div>
        </div>
      </header>

      {/* Real-time Stats Bar */}
      <div className="bg-gradient-to-r from-accent-cyan/10 via-brand/10 to-link/10 border-b border-accent-cyan/20">
        <div className="max-w-content mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-accent-cyan">{stats.activeAppointments}</div>
              <div className="text-sm text-neutral-600">Active Appointments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-brand">{stats.avgWaitTime}<span className="text-lg">min</span></div>
              <div className="text-sm text-neutral-600">Avg Wait Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-link">{stats.doctorsOnline}</div>
              <div className="text-sm text-neutral-600">Doctors Online</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-success">{stats.satisfactionRate}%</div>
              <div className="text-sm text-neutral-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16">
        <div className="max-w-content mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 text-accent-cyan font-mono text-sm font-semibold rounded-pill mb-6">
                <span className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse"></span>
                LIVE DATA
              </div>
              <h1 className="text-5xl font-bold text-neutral-900 mb-4">
                Real-time healthcare, backed by data
              </h1>
              <p className="text-lg text-neutral-600 mb-8">
                Track wait times, availability, and outcomes in real-time. Experience healthcare that optimizes for your time.
              </p>
              <div className="flex gap-4">
                <Link href="/book" className="btn-primary">Book appointment</Link>
                <Link href="/dashboard" className="btn-secondary">View dashboard</Link>
              </div>
            </div>

            {/* Live metrics dashboard */}
            <div className="bg-neutral-900 text-white rounded-card p-8 shadow-xs">
              <h2 className="text-xl font-semibold mb-6">System Status</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-neutral-400">Server Capacity</span>
                    <span className="font-mono text-sm text-success">92%</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: "92%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-neutral-400">Response Time</span>
                    <span className="font-mono text-sm text-accent-cyan">127ms</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-cyan" style={{ width: "85%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-neutral-400">Queue Length</span>
                    <span className="font-mono text-sm text-warning">8 patients</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-warning" style={{ width: "25%" }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Last updated</span>
                  <span className="font-mono text-xs text-neutral-500">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-content mx-auto px-6">
          <h2 className="text-4xl font-bold text-neutral-900 mb-12">Performance by the numbers</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { value: "2.3x", label: "Faster check-in", detail: "vs traditional methods" },
              { value: "94%", label: "Digital records", detail: "Fully accessible online" },
              { value: "4.8/5", label: "Average rating", detail: "Based on 12,847 reviews" },
            ].map((metric, i) => (
              <div key={i} className="bg-white p-8 rounded-card border-2 border-accent-cyan/20">
                <div className="text-5xl font-mono font-bold text-accent-cyan mb-2">{metric.value}</div>
                <div className="text-xl font-semibold text-neutral-900 mb-1">{metric.label}</div>
                <div className="text-sm text-neutral-600">{metric.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-accent-cyan/5 to-link/5">
        <div className="max-w-content mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">Start tracking your health data</h2>
          <p className="text-lg text-neutral-600 mb-8">Join thousands who trust us with their healthcare</p>
          <Link href="/book" className="btn-primary">Get started</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-content mx-auto px-6 text-center">
          <p>© 2024 Hospital Management. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
