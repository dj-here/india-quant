import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-xs text-amber-900">
        <span className="font-bold">⚠️ LEGAL NOTICE / COUNSEL REVIEW NOTICE: </span>
        The following terms constitute the standard marketplace operating agreement for PawStay.
        Specific insurance thresholds, liability limits, and arbitration clauses are drafted for review by company legal counsel.
      </div>

      <div className="prose prose-slate max-w-none">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">PawStay Terms of Service</h1>
        <p className="text-xs text-slate-400 mb-8">Last Updated: October 2026 · Version 1.0</p>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. Platform Nature & Agreement</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            PawStay operates an online technology platform connecting independent pet owners with independent pet care providers (&quot;Sitters&quot; or &quot;Hosts&quot;). PawStay does not provide direct pet care services, nor is PawStay an employer or broker of Sitters. Sitters operate as independent contractors.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. Trust & Identity Verification</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            All prospective Sitters are required to undergo third-party identity verification, a national criminal background check, and complete the PawStay safety quiz before listing services. Badges displayed on host profiles accurately reflect verified certifications.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. Payments, Escrow Holds & Disintermediation</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            All payments must be processed exclusively through the PawStay platform via our authorized payment provider. Taking bookings or communication off-platform (&quot;disintermediation&quot;) violates these Terms, voids all coverage under the PawStay Guarantee, and results in immediate account suspension.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">4. Veterinary Emergency Consent</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            By booking a stay, Pet Owners grant explicit authorization to Sitters and the PawStay emergency operations team to secure medical treatment from licensed veterinarians if an animal requires urgent care, up to the maximum emergency spend designated during checkout.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">5. The PawStay Guarantee</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Eligible bookings are covered under the PawStay Guarantee for veterinary reimbursement and property protection subject to the claim guidelines set forth in the Safety Guarantee Policy.
          </p>
        </section>
      </div>
    </div>
  );
}
