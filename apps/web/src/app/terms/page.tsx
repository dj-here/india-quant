import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | KidsMentor AI Tutoring',
  description:
    'Terms of service and user agreement for KidsMentor 1-on-1 AI tutoring platform. Honest AI boundaries, parent oversight, and acceptable use.',
};

export default function TermsPage() {
  return (
    <div className="bg-amber-50/20 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 lg:p-12 rounded-3xl border border-slate-200 shadow-sm">
        
        <div className="border-b border-slate-100 pb-6 mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Educational Agreement</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">KidsMentor Terms of Service</h1>
          <p className="text-xs text-slate-500">
            Terms Version 2026.1 | Effective November 2026
          </p>
        </div>

        <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-6 text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Nature of the AI Tutoring Service</h2>
            <p>
              KidsMentor is an AI-powered educational application featuring &ldquo;Ollie the Owl&rdquo;, an artificial intelligence character. <strong>There are no human teachers or tutors monitoring or participating in real-time chat sessions.</strong>
            </p>
            <p>
              The AI tutor is designed to provide Socratic guidance, conceptual scaffolding, and moral reflection prompts. The tutor does not claim human personhood, emotions, physical form, or familial experiences.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Parental Responsibility &amp; Oversight</h2>
            <p>
              Accounts are owned exclusively by parents or lawful guardians. Parents agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Manage their child&apos;s 4-digit login PIN and ensure appropriate screen time limits.</li>
              <li>Review weekly digests and support their child in completing offline Real-Life Missions.</li>
              <li>Supervise homework photograph uploads to ensure no confidential or sensitive family documents are submitted.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Verification &amp; Academic Scope</h2>
            <p>
              While STEM calculations are verified by deterministic computational engines (SymPy), KidsMentor is a supplemental learning aid aligned with NCERT standards. It does not replace accredited school enrollments or board examination registrations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Anti-Dependency &amp; Healthy Pacing</h2>
            <p>
              KidsMentor enforces server-side session limits and break reminders. Users agree not to circumvent session time restrictions or deploy automated scraping tools against our tutoring infrastructure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of India, including the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link href="/" className="font-bold text-amber-700 hover:text-amber-800">
            &larr; Back to KidsMentor Home
          </Link>
          <Link href="/onboarding" className="font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1">
            <span>Parent Onboarding</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
