'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, PhoneCall, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Emergency Crisis Contact Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 py-3 px-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-300">
            <PhoneCall className="w-4 h-4 text-rose-400" />
            <span className="font-semibold">Immediate Child Support & Crisis Resources:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span>Childline India: <strong className="text-white underline">1098</strong> (24x7 Free)</span>
            <span>Tele-MANAS: <strong className="text-white">14416</strong></span>
            <span>National Emergency: <strong className="text-white">112</strong></span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦉</span>
              <span className="text-xl font-bold text-white tracking-tight">KidsMentor</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              KidsMentor is an AI-first learning companion for children aged 6 to 16. Ollie the Owl provides 1-on-1 Socratic tutoring in NCERT Maths and Science, paired with our flagship Life Values curriculum that connects children back to their real-world families.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Compliant with India DPDP Act 2023 & COPPA</span>
            </div>
          </div>

          {/* Col 2: Curriculum */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Curriculum</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/child/home" className="hover:text-amber-400 transition-colors">NCERT Class 4-10 Mathematics</Link></li>
              <li><Link href="/child/home" className="hover:text-amber-400 transition-colors">Class 8 Science (Physics & Biology)</Link></li>
              <li><Link href="/child/values" className="hover:text-amber-400 transition-colors">12 Life Values & Ethics Modules</Link></li>
              <li><Link href="/child/values" className="hover:text-amber-400 transition-colors">Real-Life Missions with Family</Link></li>
              <li><Link href="/child/values" className="hover:text-amber-400 transition-colors">Gratitude Journal & Character Garden</Link></li>
            </ul>
          </div>

          {/* Col 3: Principles & Safety */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">AI Safety & Governance</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><span className="text-slate-300">Honest AI Identity:</span> Ollie never claims human feelings or body</li>
              <li><span className="text-slate-300">Verify Don't Trust:</span> SymPy symbolic math verification</li>
              <li><span className="text-slate-300">3-Layer Guardrails:</span> Regex + AI Classifier + Output filter</li>
              <li><span className="text-slate-300">Anti-Dependency:</span> 30-min caps, no retention guilt</li>
              <li><Link href="/parent/dashboard" className="hover:text-amber-400 transition-colors">Parent Transparency & 1-Click DPDP Delete</Link></li>
            </ul>
          </div>

          {/* Col 4: Portals */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Access Portals</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/child/login" className="hover:text-amber-400 transition-colors font-medium text-amber-300">Child PIN Login</Link></li>
              <li><Link href="/onboarding" className="hover:text-amber-400 transition-colors">Parent Signup & Consent</Link></li>
              <li><Link href="/parent/dashboard" className="hover:text-amber-400 transition-colors">Parent Governance Dashboard</Link></li>
              <li><Link href="/admin" className="hover:text-amber-400 transition-colors">Offline Educator Review Queue</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} KidsMentor. AI Tutor is the only instructor in the product. No human teachers in real-time chat.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            Built with care for children’s minds and real-world relationships.
          </div>
        </div>
      </div>
    </footer>
  );
}
