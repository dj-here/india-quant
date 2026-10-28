import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-xs text-amber-900">
        <span className="font-bold">⚠️ LEGAL NOTICE / COUNSEL REVIEW NOTICE: </span>
        This Privacy Policy complies with GDPR and CCPA requirements, including explicit Right to Access (data export) and Right to Erasure (account anonymization). Specific DPO contact details to be finalized by counsel.
      </div>

      <div className="prose prose-slate max-w-none">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">PawStay Privacy Policy</h1>
        <p className="text-xs text-slate-400 mb-8">Last Updated: October 2026 · Version 1.0</p>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. Information We Collect</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We collect personal information necessary to deliver marketplace services, including name, email address, phone number, pet medical/vet records, geolocation coordinates, and identity verification credentials (government IDs and selfie biometrics processed via encrypted verification partners).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. Geolocation & Sitter Address Privacy</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            To protect host safety and prevent harassment, exact physical addresses and precise GPS coordinates are strictly obfuscated. Sitter search results display approximate locations randomized within a 0.75-mile radius. Exact physical addresses are revealed only after a booking is accepted and paid in escrow.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. Double-Blind Review Privacy</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Reviews authored following a stay remain confidential and blinded until both parties have submitted feedback or 14 calendar days have elapsed.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">4. Your Data Rights (GDPR & CCPA)</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You may request an automated download of all personal data held by PawStay via <code className="text-xs bg-slate-100 p-1 rounded">/api/user/data-export</code> or request complete anonymization and erasure under GDPR Article 17 via <code className="text-xs bg-slate-100 p-1 rounded">/api/user/delete-account</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
