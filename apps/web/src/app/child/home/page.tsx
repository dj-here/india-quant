'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Flame, 
  ShieldAlert, 
  Clock, 
  BookOpen, 
  HeartHandshake, 
  CheckCircle2, 
  ArrowRight, 
  Award,
  Zap,
  Smile
} from 'lucide-react';

export default function ChildHomePage() {
  const [learnerName] = useState('Rohan');
  const [streakDays] = useState(5);
  const [streakFreezes] = useState(2);
  const [minsUsed] = useState(12);
  const [maxMins] = useState(30);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Learner Greeting & Streak Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 p-6 rounded-3xl shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/90 border border-amber-300 flex items-center justify-center text-3xl shadow-inner">
            🦉
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-amber-950/80">
              Welcome back!
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Good afternoon, {learnerName}!
            </h1>
            <p className="text-xs text-amber-950 font-medium">
              Ollie has prepared 3 fun puzzles & missions for today.
            </p>
          </div>
        </div>

        {/* Gamification Stats: Streaks & Freezes (Effort-based, no child-vs-child leaderboards) */}
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur px-4 py-2.5 rounded-2xl border border-amber-300/80 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-amber-600 fill-amber-500" />
            <div>
              <div className="text-sm font-black text-slate-900 leading-none">{streakDays} Days</div>
              <div className="text-[10px] font-bold text-slate-500">Learning Streak</div>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5" title="Protects your streak if you take a rest day!">
            <span className="text-base">🛡️</span>
            <div>
              <div className="text-sm font-black text-slate-900 leading-none">{streakFreezes}</div>
              <div className="text-[10px] font-bold text-slate-500">Freezes Safe</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Time Pacing Bar (Anti-Dependency Rule) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>
            <strong>Today's Screen Time:</strong> {minsUsed} of {maxMins} minutes used. Healthy minds take breaks!
          </span>
        </div>
        <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-amber-500 h-2.5 rounded-full transition-all" 
            style={{ width: `${(minsUsed / maxMins) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Grid: Today's Plan & Character Garden Mini Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 8 cols: Today's Plan */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Today's Learning Plan</span>
              </h2>
              <p className="text-xs text-slate-500">Chosen specially for your level and interests</p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
              Adaptive Selection
            </span>
          </div>

          <div className="space-y-4">
            
            {/* Plan Item 1: Maths Socratic */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-amber-300 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-2xl flex-shrink-0">
                  📐
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      Class 6 Maths • NCERT Ch 7
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> SymPy Verified
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Adding Unlike Fractions with Pizza Slices
                  </h3>
                  <p className="text-xs text-slate-600">
                    Ollie has a visual riddle about common denominators. Hint ladder ready!
                  </p>
                </div>
              </div>
              <Link
                href="/child/tutor?subject=MATHS&topic=fractions"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap self-stretch sm:self-auto justify-center"
              >
                <span>Solve with Ollie</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Plan Item 2: Science Concept */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-amber-300 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-2xl flex-shrink-0">
                  🔬
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">
                      Class 8 Science • NCERT Ch 11
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Why Do High Heels Sink into Sand? (Force & Pressure)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Socratic exploration on how surface area changes pressure ($P = F / A$).
                  </p>
                </div>
              </div>
              <Link
                href="/child/tutor?subject=SCIENCE&topic=pressure"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap self-stretch sm:self-auto justify-center"
              >
                <span>Explore Science</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Plan Item 3: Flagship Real-Life Mission */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-200 hover:border-emerald-300 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-2xl flex-shrink-0">
                  🌻
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded">
                      Life Values • Real-Life Mission
                    </span>
                    <span className="text-[10px] font-bold text-amber-700">
                      +50 XP & Garden Growth
                    </span>
                  </div>
                  <h3 className="font-extrabold text-emerald-950 text-base">
                    Mission: "The 3 Thank-Yous"
                  </h3>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Say a genuine thank you to 3 real people today (parents, sibling, or helper) and notice how their face lights up!
                  </p>
                </div>
              </div>
              <Link
                href="/child/values"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap self-stretch sm:self-auto justify-center"
              >
                <span>Start Mission</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>

        {/* Right 4 cols: Character Garden Preview & Quick Launch */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>🌱</span>
                <span>Character Garden</span>
              </h3>
              <Link href="/child/values" className="text-xs font-bold text-emerald-700 hover:underline">
                View All &rarr;
              </Link>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Your garden grows every time you practice kindness, honesty, and courage with real people!
            </p>

            {/* Plants Mini Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-center">
                <div className="text-2xl mb-1">🌻</div>
                <div className="font-extrabold text-xs text-slate-800">Gratitude</div>
                <div className="text-[10px] font-bold text-amber-700">Stage 2: Budding</div>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-center">
                <div className="text-2xl mb-1">🌷</div>
                <div className="font-extrabold text-xs text-slate-800">Empathy</div>
                <div className="text-[10px] font-bold text-emerald-700">Stage 1: Sprout</div>
              </div>
              <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200 text-center">
                <div className="text-2xl mb-1">🌹</div>
                <div className="font-extrabold text-xs text-slate-800">Respect</div>
                <div className="text-[10px] font-bold text-rose-700">Stage 3: Bloom</div>
              </div>
              <div className="bg-cyan-50 rounded-2xl p-3 border border-cyan-200 text-center">
                <div className="text-2xl mb-1">🌿</div>
                <div className="font-extrabold text-xs text-slate-800">Earth Care</div>
                <div className="text-[10px] font-bold text-cyan-700">Stage 1: Sprout</div>
              </div>
            </div>

            <Link
              href="/child/values"
              className="block text-center w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Water Your Garden & Reflect
            </Link>
          </div>

          {/* Ollie Helper Prompt */}
          <div className="bg-amber-100/70 border border-amber-300 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦉</span>
              <h4 className="font-bold text-xs text-amber-950">Ollie’s Tip of the Day</h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "When you get stuck on a tricky math puzzle, taking a deep breath and drawing a quick picture can make the mystery clear!"
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
