import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, PhoneCall } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | KidsMentor DPDP Act 2023 & COPPA Compliance',
  description:
    'KidsMentor child privacy architecture compliant with India DPDP Act 2023 (Section 9) and US COPPA. Verifiable parental consent, radical data minimization, and 1-click erasure.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-amber-50/20 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 lg:p-12 rounded-3xl border border-slate-200 shadow-sm">
        
        <div className="border-b border-slate-100 pb-6 mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Statutory Child Privacy Governance</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">KidsMentor Privacy Policy</h1>
          <p className="text-xs text-slate-500">
            Compliant with Section 9 of the India Digital Personal Data Protection Act, 2023 &amp; US COPPA (16 CFR Part 312)
          </p>
        </div>

        <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-6 text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Principle of Radical Data Minimization</h2>
            <p>
              KidsMentor is built for children aged 6 to 16. To guarantee minor safety:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>We <strong>never</strong> collect, ask for, or store a child&apos;s email address or telephone number.</li>
              <li>We <strong>never</strong> collect a child&apos;s surname, school address, or physical location.</li>
              <li>Child profiles contain only: a first name or chosen nickname, age band (6–8, 9–12, 13–16), grade level, educational board, and learning interests.</li>
              <li>Children log in via a parent-managed 4-digit PIN.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Verifiable Parental Consent (DPDP Act Section 9)</h2>
            <p>
              Before any child profile can be created, a parent or legal guardian must register and provide verifiable affirmative consent. Parents have 24/7 access to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Inspect complete conversational transcripts between their child and Ollie the AI Tutor.</li>
              <li>View all prompt versions, model targets, and deterministic mathematical verification flags.</li>
              <li>Configure daily time limits, quiet hours, and tutor strictness.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Zero Targeted Profiling &amp; Zero Advertising</h2>
            <p>
              Under Section 9(2) and 9(3) of the DPDP Act 2023, KidsMentor strictly prohibits:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Behavioral tracking or commercial psychological profiling of children.</li>
              <li>Targeted advertising, third-party trackers, or marketing pixels.</li>
              <li>Selling or renting any user data under any circumstance.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. AI Provider Zero-Data-Retention</h2>
            <p>
              All interactions with LLMs (Anthropic Claude, etc.) operate under enterprise zero-data-retention (ZDR) agreements. No student prompts, homework photos, or voice clips are ever used to train or fine-tune public models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Right to Erasure &amp; 1-Click Data Export</h2>
            <p>
              Parents hold sovereign rights over all stored data. At any time via the Parent Dashboard:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>1-Click Export:</strong> Download all child data, session logs, and Character Garden items in standard JSON format.</li>
              <li><strong>1-Click Erasure:</strong> Irrevocably purge all child profiles, messages, attempts, and memories permanently from our database.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">6. Crisis Escalation &amp; Childline India (1098)</h2>
            <p>
              In compliance with the POCSO Act 2012 and Juvenile Justice regulations, disclosures of physical abuse, neglect, or suicidal distress trigger automated crisis responses providing the 24x7 toll-free Childline India helpline (1098) and immediate parent notification.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link href="/" className="font-bold text-amber-700 hover:text-amber-800">
            &larr; Back to KidsMentor Home
          </Link>
          <div className="flex items-center gap-1.5 text-slate-400">
            <PhoneCall className="w-3.5 h-3.5 text-rose-500" /> Childline India: 1098
          </div>
        </div>

      </div>
    </div>
  );
}
