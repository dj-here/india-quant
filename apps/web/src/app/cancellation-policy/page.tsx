import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, ShieldCheck, CheckCircle } from 'lucide-react';

export default function CancellationPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
        </Link>
      </div>

      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          Transparent Standards
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Cancellation & Refund Policy</h1>
        <p className="text-sm text-slate-500 mt-1">
          PawStay offers three host-selected cancellation tiers with clear, predictable refunds calculated down to the second.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Flexible */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-lg">Flexible</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                1-Day Window
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Ideal for pet parents with dynamic travel plans.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 font-medium">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>100% Refund:</strong> Cancel &gt;24 hours before check-in.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>50% Refund:</strong> Cancel within 24 hours of check-in.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Moderate (Default) */}
        <div className="bg-white rounded-2xl border-2 border-emerald-600 p-6 shadow-sm flex flex-col justify-between relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full">
            Platform Default
          </div>
          <div>
            <div className="flex items-center justify-between mb-3 mt-1">
              <h3 className="font-bold text-slate-900 text-lg">Moderate</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                5-Day Window
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Balanced protection for pet parents and sitters.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 font-medium">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>100% Refund:</strong> Cancel &gt;120 hours (5 days) before check-in.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>50% Refund:</strong> Cancel within 5 days of check-in.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Strict */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-lg">Strict</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                7-Day Window
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Maximum schedule predictability for high-demand hosts.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 font-medium">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>100% Refund:</strong> Cancel &gt;168 hours (7 days) before check-in.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>50% Refund:</strong> Cancel within 7 days of check-in.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 text-sm">Sitter-Initiated Cancellations</h4>
        <p>
          If a sitter must cancel a confirmed stay for any reason, the Pet Owner receives a <strong>100% immediate full refund</strong> (including all platform service fees) and priority re-booking support from our concierge emergency matching team.
        </p>
      </div>
    </div>
  );
}
