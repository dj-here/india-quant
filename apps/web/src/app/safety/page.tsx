import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Heart,
  PhoneCall,
  Lock,
  FileCheck,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export default function SafetyGuaranteePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
        </Link>
      </div>

      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
          <ShieldCheck className="h-4 w-4" />
          <span>The PawStay Guarantee</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Trust, Safety & Pet Protection
        </h1>
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
          Every stay booked on PawStay is backed by comprehensive safety screening, 24/7 veterinary response, and the PawStay Guarantee.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl inline-block mb-4">
            <FileCheck className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Mandatory Background Checks</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every sitter must pass third-party biometric identity verification, national criminal background screening, and our pet safety assessment before being listed.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl inline-block mb-4">
            <Heart className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Up to $25,000 Vet Care Coverage</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            In the rare event of an accidental illness or injury during an eligible stay, veterinary reimbursement coverage is provided under our platform guarantee scaffold.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl inline-block mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Escrow Payment Protection</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Funds are held securely in escrow from booking until 24 hours after stay completion. If care does not meet standards, payments are halted for admin adjudication.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl inline-block mb-4">
            <PhoneCall className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">24/7 Dedicated Emergency Team</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our priority operations hotline (1-800-555-PAWS) and in-app 1-click emergency button dispatch instant alerts to sitters, pet emergency contacts, and ops.
          </p>
        </div>
      </div>
    </div>
  );
}
