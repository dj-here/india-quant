import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Check, ShieldCheck, Zap, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Institutional Packages & Commercial Pricing',
  description:
    'Transparent pricing in INR for engineering colleges: Foundation, Placement-Ready Accelerator, and Premium Mentorship, plus our risk-free ₹25k Pilot Offer.',
};

export default function PackagesPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-100/60 px-3 py-1 rounded-full">
            Institutional Commercials & Packages
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Transparent, Value-Driven Pricing in INR
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Choose from flexible per-student or institutional batch models. Zero hidden costs, full 18% GST compliance (SAC 999293), and milestone-based invoicing.
          </p>
        </div>

        {/* Subsidized Pilot Banner */}
        <div id="pilot" className="mb-16 rounded-3xl bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 p-8 lg:p-10 text-white shadow-xl relative overflow-hidden border border-sky-500/30">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5" /> Zero Budgetary Risk
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">
              The 2-Week &ldquo;Placement Kickstart&rdquo; Pilot Offer
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Before committing your full semester budget, test CampusEdge on 1 cohort of 60 students. Experience our lead trainers, student engagement, and Monday MIS reporting.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <span className="text-slate-300 block">Duration:</span>
                <strong className="text-white text-sm">20 Contact Hours</strong>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <span className="text-slate-300 block">Pilot Fee:</span>
                <strong className="text-emerald-400 text-sm">₹25,000 Flat + GST</strong>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <span className="text-slate-300 block">Risk Guarantee:</span>
                <strong className="text-white text-sm">100% Contract Offset</strong>
              </div>
            </div>
            <p className="text-xs text-sky-200">
              * If your college signs a full semester contract, the entire ₹25,000 is credited as an advance discount on your first invoice.
            </p>
            <div className="pt-2">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-md transition-all active:scale-95"
              >
                Book Your 2-Week Pilot Slot <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Main Packages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 items-stretch">
          
          {/* Package 1: Foundation */}
          <div className="rounded-3xl bg-white border border-slate-200 p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tier 01</span>
              <h3 className="text-2xl font-black text-slate-900">Campus Foundation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ideal for 2nd Year (Sem 3/4) &amp; early 3rd Year. Builds computational thinking, core OOP, linear DSA, and eliminates coding phobia.
              </p>

              <div className="pt-4 border-t border-slate-100">
                <div className="text-3xl font-black text-slate-900">₹3,500 <span className="text-sm font-normal text-slate-500">/ student</span></div>
                <div className="text-xs text-slate-500 mt-1">or ₹1,80,000 per 60-student batch</div>
              </div>

              <div className="space-y-2.5 pt-4 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>120 Total Program Hours</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>60h Linear DSA (Arrays, Lists, Stacks)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>40h Foundational Quantitative &amp; Logic</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>20h Spoken English &amp; Professional Basics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bi-weekly assessments &amp; remedial tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Co-branded verified completion certificate</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/demo"
                className="block w-full py-3 text-center rounded-xl border border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-sm transition-colors"
              >
                Request Foundation Proposal
              </Link>
            </div>
          </div>

          {/* Package 2: Placement Accelerator (Flagship) */}
          <div className="rounded-3xl bg-white border-2 border-sky-600 p-8 flex flex-col justify-between shadow-xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Most Popular Flagship
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Tier 02 • Core Placement</span>
              <h3 className="text-2xl font-black text-slate-900">Placement-Ready Accelerator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Targeted at 3rd Year (Sem 6) &amp; 4th Year. Our comprehensive recruitment engine covering advanced DSA, speed aptitude, and 1-on-1 mock interviews.
              </p>

              <div className="pt-4 border-t border-slate-100">
                <div className="text-3xl font-black text-slate-900">₹5,500 <span className="text-sm font-normal text-slate-500">/ student</span></div>
                <div className="text-xs text-sky-600 font-semibold mt-1">or ₹2,85,000 per 60-student batch</div>
              </div>

              <div className="space-y-2.5 pt-4 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600 shrink-0" />
                  <span><strong>200 Total Program Hours</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>96h Full DSA (DP, Trees, Graphs, Tries, Heaps)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>64h Speed Aptitude &amp; Company Test Series</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>40h Corporate Finishing, GD &amp; Resume</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600 shrink-0" />
                  <span><strong>1-on-1 Mock Interview</strong> per student</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Monday 9 AM MIS + Real-Time TPO Portal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>NBA Criterion 4 &amp; NAAC 5.1.3 audit dossier</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/demo"
                className="block w-full py-3.5 text-center rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-sm shadow-md transition-all active:scale-95"
              >
                Request Accelerator Proposal
              </Link>
            </div>
          </div>

          {/* Package 3: Premium Mentorship */}
          <div className="rounded-3xl bg-white border border-slate-200 p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tier 03 • Super-Dream</span>
              <h3 className="text-2xl font-black text-slate-900">Premium Mentorship &amp; Product Incubator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Elite cohort for the top 15-20% students aiming for 12+ LPA to 30+ LPA marquee offers from Amazon, Cisco, Microsoft, Goldman Sachs, and unicorns.
              </p>

              <div className="pt-4 border-t border-slate-100">
                <div className="text-3xl font-black text-slate-900">₹8,500 <span className="text-sm font-normal text-slate-500">/ student</span></div>
                <div className="text-xs text-slate-500 mt-1">or ₹2,45,000 per 35-student cohort</div>
              </div>

              <div className="space-y-2.5 pt-4 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>300+ Program Hours + 1-on-1 Mentorship</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>140h Advanced Competitive Algorithms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>40h System Design (LLD &amp; HLD) + Redis/Kafka</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>3 Full 1-on-1 Mock Rounds</strong> per student</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>GitHub portfolio review &amp; direct recruiter referral</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Distinguished Honours Credential</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/demo"
                className="block w-full py-3 text-center rounded-xl border border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-sm transition-colors"
              >
                Request Premium Proposal
              </Link>
            </div>
          </div>

        </div>

        {/* Commercial Terms & Governance */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-10 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" /> Commercial Governance &amp; Payment Terms
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Milestone Invoicing Schedule</h4>
              <p>• <strong>30% Advance</strong> upon MoU execution &amp; trainer allocation</p>
              <p>• <strong>40% Mid-Term</strong> upon delivering 50% scheduled hours</p>
              <p>• <strong>30% Settlement</strong> post grand mock test &amp; certificate dispatch</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">GST &amp; Statutory Compliance</h4>
              <p>• Applicable GST: <strong>18%</strong> under SAC Code <strong>999293</strong></p>
              <p>• Invoices structured for institutional Input Tax Credit (ITC)</p>
              <p>• Statutory TDS applicable under Section 194J / 194C</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Volume Institutional Discounts</h4>
              <p>• Available for cohorts exceeding 300 students across branches</p>
              <p>• Multi-year MoU fee freezes available for university trusts</p>
              <p>• Dedicated on-campus operations coordinator included</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
