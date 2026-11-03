import React from 'react';
import Link from 'next/link';
import { prisma } from '@pawstay/db';
import {
  Code2,
  BrainCircuit,
  Users2,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  Star,
  Zap,
  Target,
  FileSpreadsheet
} from 'lucide-react';

export const revalidate = 60; // ISR cache 60s

const fallbackTestimonials = [
  {
    id: 't1',
    authorName: 'Prof. Rajesh Shinde',
    designation: 'Head - Training & Placement',
    collegeName: 'Vidyapeeth Institute of Technology',
    city: 'Pune, Maharashtra',
    quote:
      'CampusEdge transformed our Day-1 placement results. In our 2026 drive, 74% of our CSE cohort cleared the first coding round of visiting companies, compared to barely 30% previously. Their Monday MIS reports kept our faculty completely in the loop.',
    rating: 5,
  },
  {
    id: 't2',
    authorName: 'Dr. Srinivasa Rao',
    designation: 'Principal',
    collegeName: 'Sahyadri College of Engineering & Management',
    city: 'Mangaluru, Karnataka',
    quote:
      'The 20-80 active coding methodology is what sets CampusEdge apart. Students weren’t sitting through boring PowerPoint presentations—they were actively coding and competing on live leaderboards. Our student attendance stayed above 92% throughout.',
    rating: 5,
  },
  {
    id: 't3',
    authorName: 'Prof. S. Murugan',
    designation: 'Director of Career Guidance',
    collegeName: 'Coimbatore Institute of Engineering & Technology',
    city: 'Coimbatore, Tamil Nadu',
    quote:
      'We started with their ₹25,000 2-Week Pilot on one batch. Within ten days, the score improvement was so undeniable that our Academic Council approved the full 200-hour accelerator for all branches. Best institutional decision we made this year.',
    rating: 5,
  },
];

export default async function HomePage() {
  let testimonials = fallbackTestimonials;
  try {
    const dbTestimonials = await prisma.testimonial.findMany({
      where: { isFeatured: true },
      orderBy: { order: 'asc' },
      take: 3,
    });
    if (dbTestimonials && dbTestimonials.length > 0) {
      testimonials = dbTestimonials;
    }
  } catch (err) {
    // Fallback gracefully during static prerendering
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* =========================================================================
          HERO SECTION
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto lg:max-w-none lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" /> Company-Standard Training for Indian Colleges
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Turn Campus Placements into <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">High-Package Career Launches</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
                We help college T&P cells break the 30% Day-1 barrier. Ex-FAANG and tier-1 instructors delivering intensive, hands-on <strong className="text-white">DSA (Java/Python/C++)</strong>, <strong className="text-white">Speed Aptitude</strong>, and <strong className="text-white">Corporate Mock Interviews</strong>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-sky-500/25 transition-all active:scale-95"
                >
                  Request Free TPO Demo <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/assessment"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-base transition-colors"
                >
                  Try Free Readiness Test (20 MCQs)
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> NAAC 5.1.3 & NBA Criterion 4
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-400" /> 40+ Partner Institutions
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> Verified Digital Certificates
                </span>
              </div>
            </div>

            {/* Hero Quick Stat Box */}
            <div className="mt-12 lg:mt-0 lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between pb-6 border-b border-slate-700">
                  <div>
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Proven Impact</span>
                    <h3 className="text-xl font-bold text-white mt-1">Average Partner Metrics</h3>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                    2026 Season
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6">
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-3xl font-black text-white">72.4%</div>
                    <div className="text-xs text-slate-400 font-medium mt-1">Day-1 Test Clearance</div>
                    <div className="text-[10px] text-emerald-400 font-bold mt-1">↑ from 32% baseline</div>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-3xl font-black text-white">+50%</div>
                    <div className="text-xs text-slate-400 font-medium mt-1">Median CTC Growth</div>
                    <div className="text-[10px] text-emerald-400 font-bold mt-1">₹3.6L → ₹5.4L</div>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-3xl font-black text-white">3.2x</div>
                    <div className="text-xs text-slate-400 font-medium mt-1">Super-Dream Offers</div>
                    <div className="text-[10px] text-sky-400 font-bold mt-1">&gt; 7 LPA packages</div>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-3xl font-black text-white">92%+</div>
                    <div className="text-xs text-slate-400 font-medium mt-1">Cohort Attendance</div>
                    <div className="text-[10px] text-emerald-400 font-bold mt-1">Gamified Leaderboards</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/40 flex items-center justify-between text-xs">
                  <span className="text-sky-300 font-medium">Subsidized 2-Week Pilot Available:</span>
                  <span className="text-white font-bold bg-sky-600 px-2.5 py-1 rounded-md">₹25,000 Flat</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          THE THREE CORE CURRICULUM PILLARS
         ========================================================================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-sky-600 tracking-widest uppercase">The CampusEdge Engine</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              Three Pillars of Placement Clearance
            </h3>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              We eliminate traditional slide presentations. Our <strong className="text-slate-900">20-80 active learning framework</strong> combines 20 minutes of concept breakdown with 80 minutes of proctored coding and problem solving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: DSA */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 hover:shadow-lg hover:border-sky-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-6 shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">1. Technical & DSA Mastery</h4>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Comprehensive 16-week syllabus spanning Arrays, Two-Pointers, Sliding Window to Dynamic Programming and Graph Algorithms.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span><strong>Polyglot:</strong> Java 21, C++20 (STL), Python 3.11</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>200+ LeetCode-standard problems solved</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Live leaderboards in every practical lab session</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>System Design primer for dream 12+ LPA roles</span>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link href="/programs#dsa" className="text-sky-600 text-xs font-bold inline-flex items-center gap-1 hover:text-sky-700">
                  View Full Week-by-Week Syllabus →
                </Link>
              </div>
            </div>

            {/* Pillar 2: Aptitude */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 hover:shadow-lg hover:border-indigo-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">2. Speed Cognitive Aptitude</h4>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                High-speed mental math, Vedic shortcut techniques, syllogisms, and company-specific question pattern series.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Quantitative: Time-Work, Speed-Distance, P&L</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Logical: Syllogisms, Seating Puzzles, Blood Relations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Verbal: Reading Comprehension, Sentence Correction</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Dedicated TCS NQT, Infosys DSY & Cognizant Series</span>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link href="/programs#aptitude" className="text-indigo-600 text-xs font-bold inline-flex items-center gap-1 hover:text-indigo-700">
                  Explore Aptitude Modules →
                </Link>
              </div>
            </div>

            {/* Pillar 3: Soft Skills */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 hover:shadow-lg hover:border-teal-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-6 shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
                <Users2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">3. Corporate Finishing & Mocks</h4>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Transform technical skill into job offers through single-page ATS resume engineering, group discussion drills, and 1-on-1 mocks.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Single-page ATS Resume Engineering (Google XYZ format)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Simulated Group Discussions with video feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>STAR behavioral interview question frameworks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span><strong>1-on-1 Mock Interview</strong> with external industry lead</span>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link href="/programs#soft-skills" className="text-teal-600 text-xs font-bold inline-flex items-center gap-1 hover:text-teal-700">
                  View Soft Skills Rubrics →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TRADITIONAL VENDORS VS CAMPUSEDGE COMPARISON
         ========================================================================= */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-sky-600 tracking-widest uppercase">The Institutional Difference</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
              Why Forward-Thinking TPOs Switch to CampusEdge
            </h3>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-900 text-white font-bold text-sm py-4 px-6">
              <div className="col-span-4 text-slate-300">Feature / Dimension</div>
              <div className="col-span-4 text-red-400">Traditional EdTech Vendors</div>
              <div className="col-span-4 text-emerald-400">CampusEdge Solutions</div>
            </div>

            <div className="divide-y divide-slate-100 text-sm">
              <div className="grid grid-cols-12 py-4 px-6 items-center">
                <div className="col-span-4 font-semibold text-slate-900">Pedagogical Model</div>
                <div className="col-span-4 text-slate-500">80% Slide Lecture, 20% Lab (Boring)</div>
                <div className="col-span-4 font-medium text-emerald-700">20% Theory, 80% Active Hands-on Coding</div>
              </div>
              <div className="grid grid-cols-12 py-4 px-6 items-center bg-slate-50/50">
                <div className="col-span-4 font-semibold text-slate-900">TPO Reporting</div>
                <div className="col-span-4 text-slate-500">End-of-semester delayed PDF</div>
                <div className="col-span-4 font-medium text-emerald-700">Monday 9 AM MIS + Real-Time Live Portal</div>
              </div>
              <div className="grid grid-cols-12 py-4 px-6 items-center">
                <div className="col-span-4 font-semibold text-slate-900">Trainer Pedigree</div>
                <div className="col-span-4 text-slate-500">Junior freelance trainers with no product experience</div>
                <div className="col-span-4 font-medium text-emerald-700">Ex-FAANG / Tier-1 Software Engineers & Placement Advisors</div>
              </div>
              <div className="grid grid-cols-12 py-4 px-6 items-center bg-slate-50/50">
                <div className="col-span-4 font-semibold text-slate-900">Accreditation Support</div>
                <div className="col-span-4 text-slate-500">Generic attendance sheets requiring manual work</div>
                <div className="col-span-4 font-medium text-emerald-700">Ready-to-audit NBA Criterion 4 & NAAC 5.1.3 Dossier</div>
              </div>
              <div className="grid grid-cols-12 py-4 px-6 items-center">
                <div className="col-span-4 font-semibold text-slate-900">Risk Reversal</div>
                <div className="col-span-4 text-slate-500">Demands 100% full-semester upfront commitment</div>
                <div className="col-span-4 font-medium text-emerald-700">2-Week Subsidized Pilot with 100% Contract Offset Guarantee</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4-STAGE PILOT-TO-CONTRACT FUNNEL
         ========================================================================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-sky-600 tracking-widest uppercase">The Partnership Roadmap</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
              How We Partner with Your Institution
            </h3>
            <p className="text-slate-600 text-sm mt-3">
              Zero budgetary risk. Evaluate our instructors and student response before committing institutional budgets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base">Free 90-Min Masterclass</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live interactive coding breakdown & free 20-question diagnostic test for 150+ students. Observe trainer pedigree firsthand.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border-2 border-sky-500 bg-sky-50/50 text-center space-y-3 shadow-md">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Low Risk
              </span>
              <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h4 className="font-bold text-sky-950 text-base">2-Week Kickstart Pilot</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                20 contact hours for 1 cohort of 60 students at ₹25,000. 100% of this fee is credited against your full semester contract.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center mx-auto text-sm">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base">Full Semester Contract</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                120h or 200h comprehensive deployment across all eligible branches. Integrated seamlessly into your academic timetable.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center mx-auto text-sm">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-base">Annual Renewal & MoU</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-year institutional partnership with exclusive campus hackathons and direct corporate referral pipelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          VERIFIED SOCIAL PROOF & TESTIMONIALS
         ========================================================================= */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-sky-400 tracking-widest uppercase">Verified TPO Feedback</h2>
            <h3 className="text-3xl font-extrabold text-white mt-2">
              Trusted by Leading College Placement Cells
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-slate-800 bg-slate-800/60 p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 text-amber-400 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed italic mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-700/80">
                  <h5 className="font-bold text-white text-sm">{t.authorName}</h5>
                  <p className="text-xs text-sky-400 font-medium">{t.designation}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.collegeName}, {t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL HIGH-CONVERSION CTA STRIP
         ========================================================================= */}
      <section className="py-20 bg-gradient-to-r from-sky-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Elevate Your Institution’s Placement Clearance?
          </h3>
          <p className="text-sky-100 text-base max-w-2xl mx-auto">
            Book a complimentary 90-minute placement diagnostic masterclass for your 3rd-year cohort or schedule a briefing with our Academic Director.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/demo"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-extrabold text-base shadow-lg hover:bg-slate-100 transition-all active:scale-95"
            >
              Request Free Demo / Institutional Proposal
            </Link>
            <a
              href="https://wa.me/919820144550?text=Hi%20CampusEdge,%20we%20want%20to%20schedule%20a%20placement%20demo%20for%20our%20college."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-colors"
            >
              Chat on WhatsApp (+91 98201 44550)
            </a>
          </div>
          <p className="text-xs text-sky-200 pt-2">
            * 100% risk-free. No commitments. All data processed in accordance with India&apos;s DPDP Act 2023.
          </p>
        </div>
      </section>
    </div>
  );
}
