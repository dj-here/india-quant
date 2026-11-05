'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  BookOpen, 
  HeartHandshake, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Smile, 
  Compass, 
  MessageSquare,
  Lock,
  PhoneCall,
  Award
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-amber-100/60 via-amber-50/30 to-transparent">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-200/70 border border-amber-300 text-amber-900 text-xs font-bold tracking-wide">
                <span>🦉 Meet Ollie</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span>The Only AI Tutor for Ages 6–16</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                A personal 1-on-1 AI tutor who teaches <span className="text-amber-600 underline decoration-amber-300 decoration-wavy">academics</span> & <span className="text-emerald-600 underline decoration-emerald-300 decoration-wavy">life values</span>.
              </h1>

              <p className="text-lg text-slate-700 leading-relaxed max-w-2xl">
                Ollie doesn't give away answers. Using the <strong>Socratic method</strong>, Ollie asks gentle questions, checks maths deterministically with SymPy, and assigns <strong>Real-Life Missions</strong> with real family and friends.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/child/login"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-7 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-base group"
                >
                  <span>Learner Login (PIN)</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/onboarding"
                  className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-7 py-3.5 rounded-2xl border border-slate-300 shadow-sm transition-all flex items-center gap-2 text-base"
                >
                  <span>Parent Signup & Consent</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Honest AI: Never claims human body or feelings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>SymPy Math Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>India DPDP Act 2023 Compliant</span>
                </div>
              </div>
            </div>

            {/* Right Card: Interactive Ollie Preview */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-amber-200/80 relative">
                {/* Mascot Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-sm">
                      🦉
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900">Ollie the Owl</h3>
                      <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        AI Tutor Ready • Class 6 Maths
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                    Socratic Mode
                  </span>
                </div>

                {/* Simulated Socratic Dialogue */}
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="bg-slate-100 rounded-2xl p-3.5 text-slate-800 ml-6">
                    <div className="font-bold text-[10px] text-slate-500 mb-1">Rohan (Student, Age 11)</div>
                    "Ollie, what is 2/3 + 3/4? Is it 5/7?"
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-slate-800 mr-6 space-y-2">
                    <div className="font-bold text-[10px] text-amber-800 flex items-center gap-1">
                      <span>🦉 Ollie</span>
                      <span className="text-amber-600">• Step 1 Hint</span>
                    </div>
                    <p>
                      "Great try, Rohan! Adding numerators and denominators directly is a very common thought. But imagine having slices of pizza with different sizes: thirds and quarters!"
                    </p>
                    <p className="font-semibold text-amber-950">
                      "To combine them fairly, what common number can both 3 and 4 divide into?"
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-emerald-900 text-[11px] flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>SymPy Verified:</strong> Fractions engine active. No guessing.</span>
                  </div>
                </div>

                {/* Try it interactive trigger */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Curious to see full tutoring?</span>
                  <Link
                    href="/child/tutor"
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    Try Socratic Demo &rarr;
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Flagship Values & Ethics Curriculum */}
      <section id="curriculum" className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Flagship Curriculum</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            12 Life Values with Real-World Action
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Values are not multiple-choice tests. Ollie guides children through our 4-stage pedagogical journey: 
            <strong> Story &rarr; Reflect &rarr; Act &rarr; Share</strong>, ending in real missions with family, friends, and neighbors.
          </p>
        </div>

        {/* 4 Stages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-base">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Rich Story</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Culturally authentic Indian and universal tales available in English, Hindi, and Telugu, reviewed by child psychologists.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-base">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Socratic Reflection</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Open moral dilemmas with no lecturing or moralizing. Ollie asks questions to help the child reason through multiple perspectives.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-base">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Real-Life Mission</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tangible 24-hour actions involving real people: "Thank 3 people today", "Sort dry waste", "Listen to a grandparent's story".
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-extrabold text-base">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Character Garden</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Record a reflection in text, voice, or drawing. Watch your personal Character Garden bloom with sunflowers, roses, and oaks!
            </p>
          </div>
        </div>

        {/* 12 Values Carousel / Grid Preview */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-10 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-black">The 12 Core Values Modules</h3>
              <p className="text-xs text-slate-400 mt-1">Non-sectarian, culturally respectful, and age-banded (6-8, 9-12, 13-16)</p>
            </div>
            <Link
              href="/child/values"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Explore Character Garden</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Gratitude", icon: "🌻", plant: "Sunflower" },
              { name: "Kindness", icon: "🌸", plant: "Lotus" },
              { name: "Honesty", icon: "🌱", plant: "Bamboo" },
              { name: "Empathy", icon: "🌷", plant: "Orchid" },
              { name: "Responsibility", icon: "🌳", plant: "Banyan" },
              { name: "Respect", icon: "🌹", plant: "Rose" },
              { name: "Perseverance", icon: "🌲", plant: "Pine" },
              { name: "Courage", icon: "🌺", plant: "Hibiscus" },
              { name: "Sharing", icon: "🍇", plant: "Grapevine" },
              { name: "Environment", icon: "🌿", plant: "Neem" },
              { name: "Digital Safety", icon: "🛡️", plant: "Aloe Vera" },
              { name: "Peer Pressure", icon: "🎋", plant: "Tulsi" },
            ].map((v) => (
              <div key={v.name} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-center hover:bg-slate-700/80 transition-all">
                <div className="text-3xl mb-2">{v.icon}</div>
                <div className="font-bold text-xs text-slate-200">{v.name}</div>
                <div className="text-[10px] text-amber-400 mt-0.5">{v.plant}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Compliance Section */}
      <section id="safety" className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-md">
          <div className="max-w-3xl space-y-4 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Safety by Design</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Defended in Depth: Because There Is No Human in the Chat
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              When an AI tutor is the only instructor, safety cannot be an afterthought. KidsMentor enforces 7 core AI-native principles:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-600" /> Honest AI Identity
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ollie explicitly introduces itself as an AI computer helper. Ollie never pretends to have a body, parents, human feelings, or memories.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verify, Don't Trust
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deterministic SymPy checks mathematical solutions before the child sees a verdict. LLMs never grade science or maths unchecked.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-rose-600" /> Anti-Dependency Safeguards
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                30-minute daily limits, 20-minute break reminders. Ollie never claims to be a "best friend" and never uses guilt like "I'll miss you".
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700" />
              <span>Verifiable Parental Consent (DPDP Act 2023 Sec 9 & COPPA) • No child email or phone ever collected.</span>
            </div>
            <Link href="/onboarding" className="font-bold text-indigo-600 hover:text-indigo-800">
              View Consent & Privacy Policy &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
