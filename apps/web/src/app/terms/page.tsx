import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Institutional Terms of Service',
  description:
    'Terms of service governing college partnerships, training deliverables, intellectual property, and payment obligations with CampusEdge EdTech Pvt. Ltd.',
};

export default function TermsPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 lg:p-12 rounded-3xl border border-slate-200 shadow-sm">
        
        <div className="border-b border-slate-100 pb-6 mb-8 space-y-2">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Institutional Commercial Terms</span>
          <h1 className="text-3xl font-black text-slate-900">Institutional Terms of Service</h1>
          <p className="text-xs text-slate-500">
            Last Updated: November 2026 | CampusEdge EdTech Private Limited
          </p>
        </div>

        <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-6 text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Nature of Agreement</h2>
            <p>
              These Terms of Service govern the institutional provision of technical training, cognitive aptitude coaching, soft skills finishing, and placement readiness diagnostics provided by <strong>CampusEdge EdTech Private Limited</strong> (&ldquo;CampusEdge&rdquo;) to colleges, institutes, universities, and students. Execution of a formal Purchase Order or Memorandum of Understanding (MoU) incorporates these terms by reference.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Training Delivery Standards</h2>
            <p>
              CampusEdge warrants that all training tracks shall be delivered by certified lead instructors possessing demonstrable software industry experience. CampusEdge adheres to a 1:30 teaching assistant ratio during practical programming labs and commits to replacing any trainer within forty-eight (48) hours in the event of an institutional quality grievance verified by our Academic Review Board.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. College Infrastructure Responsibilities</h2>
            <p>
              The partner institution shall provide computer laboratories with 1 functional machine per enrolled student, reliable internet connectivity (minimum 50 Mbps bandwidth), high-definition projectors, and enforce student attendance compliance (minimum 80% attendance to qualify for verified digital credentials).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Commercial Terms, GST &amp; Invoicing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All institutional quotations are in Indian National Rupees (INR) and subject to applicable statutory <strong>Goods and Services Tax (GST) at 18%</strong> under SAC Code 999293.</li>
              <li>Milestone billing: Standard split is 30% mobilization advance upon contract signing, 40% upon completing 50% scheduled hours (mid-term milestone), and 30% final settlement within 15 calendar days of final report dispatch.</li>
              <li>Tax Deducted at Source (TDS) shall be deducted by the institution in accordance with prevailing Indian Income Tax regulations under Section 194J or 194C.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. 2-Week Pilot Offset Guarantee</h2>
            <p>
              For institutions undertaking our subsidized 2-Week Placement Kickstart Pilot (₹25,000 + GST for 60 students), one hundred percent (100%) of the pilot fee shall be credited as an advance discount on the college&apos;s first full semester contract invoice upon formal onboarding.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">6. Intellectual Property Rights</h2>
            <p>
              All lecture courseware, coding problem statements, software test platforms, and diagnostic rubrics remain the exclusive intellectual property of CampusEdge EdTech Private Limited. Enrolled students and faculty receive a limited, non-exclusive, non-transferable license solely for personal educational use during the training period.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">7. Governing Law &amp; Jurisdiction</h2>
            <p>
              These terms shall be construed in accordance with the laws of the Republic of India. Any legal dispute arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
