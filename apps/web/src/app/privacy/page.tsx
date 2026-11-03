import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | DPDP Act 2023 Compliance',
  description:
    'CampusEdge privacy policy compliant with India’s Digital Personal Data Protection (DPDP) Act, 2023. Clear information on student and institutional data governance.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 lg:p-12 rounded-3xl border border-slate-200 shadow-sm">
        
        <div className="border-b border-slate-100 pb-6 mb-8 space-y-2">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Legal &amp; Regulatory Governance</span>
          <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
          <p className="text-xs text-slate-500">
            Last Updated: November 2026 | Compliant with India&apos;s Digital Personal Data Protection (DPDP) Act, 2023
          </p>
        </div>

        <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-6 text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Commitment to Data Protection</h2>
            <p>
              CampusEdge Learning Solutions (operating under legal entity <em>CampusEdge EdTech Private Limited</em>, hereinafter &ldquo;CampusEdge&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is committed to safeguarding personal and institutional data in accordance with the provisions of India&apos;s <strong>Digital Personal Data Protection Act, 2023 (DPDP Act 2023)</strong> and applicable higher education data standards.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Categories of Data Collected</h2>
            <p>We collect data under two distinct streams:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Institutional Decision-Maker Data:</strong> Name, official designation, college name, official email address, mobile phone number, student strength, and institutional requirements submitted via proposal and demo inquiry forms.</li>
              <li><strong>Student Assessment Data:</strong> Candidate name, academic email, contact number, degree program, branch, graduation year, timed MCQ responses, coding scores, and diagnostic test analytics.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Purpose of Processing &amp; Affirmative Consent</h2>
            <p>
              Under Section 6 of the DPDP Act 2023, personal data is processed solely on the basis of explicit, informed affirmative consent for the following specified academic purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Evaluating and presenting student placement readiness diagnostic reports.</li>
              <li>Compiling section-wise attendance and progress reports formatted for institutional <strong>NBA Criterion 4</strong> and <strong>NAAC Criterion 5.1.3</strong> audits.</li>
              <li>Coordinating training schedules, lab pre-flight verifications, and trainer allocations with the partner college.</li>
              <li>Issuing digitally verifiable certificates of course completion.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Prohibition of Commercial Data Resale</h2>
            <p>
              <strong>We do not sell, rent, lease, or monetize student or institutional personal data to third-party commercial aggregators, loan providers, or advertising networks.</strong> Personal information is strictly utilized for the institutional education and assessment services contracted by the partner college or authorized by the student.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Data Retention &amp; Erasure (Section 12 DPDP Act)</h2>
            <p>
              Personal data is retained only for the duration required to satisfy pedagogical delivery and accreditation verification (typically up to the completion of the students&apos; graduating academic cycle). Upon written request by an authorized college authority or individual data principal, student records can be permanently expunged from our active operational databases within thirty (30) calendar days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">6. Data Protection Officer (DPO) Contact</h2>
            <p>
              In compliance with the DPDP Act 2023, queries, grievances, or requests for data review may be addressed to our designated Data Protection Grievance Officer:
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">Grievance Redressal Desk</p>
              <p>CampusEdge EdTech Private Limited</p>
              <p>Email: <a href="mailto:privacy@campusedge.in" className="text-sky-600 font-semibold">privacy@campusedge.in</a> / <a href="mailto:partnerships@campusedge.in" className="text-sky-600 font-semibold">partnerships@campusedge.in</a></p>
              <p>Phone: +91 98201 44550</p>
              <p>Address: #402, Outer Ring Road, Bellandur, Bengaluru, Karnataka – 560103</p>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
