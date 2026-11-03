import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Award, ShieldCheck, Terminal, Users, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us & Trainer Pedigree',
  description:
    'Founded by tech veterans and academic placement advisors. Learn about our 20-80 active coding pedagogy and certified instructor standards.',
};

export default function AboutPage() {
  const trainers = [
    {
      name: 'Aditya Shenoy',
      role: 'Head of Technical Curriculum (ex-Amazon, Goldman Sachs)',
      bio: '12+ years in large-scale distributed systems and algorithmic design. Conducted 400+ technical interviews and trained over 15,000 engineering students in competitive DSA.',
      expertise: 'Dynamic Programming, Graph Theory, System Design',
    },
    {
      name: 'Dr. Meenakshi Sundaram',
      role: 'Dean of Academic Partnerships & Accreditation',
      bio: 'Former Engineering College Principal and NBA/NAAC evaluator with 22 years in Indian technical higher education. Expert in Criterion 4 SAR compliance and industry-academia synergy.',
      expertise: 'Accreditation Frameworks, Institutional Strategy',
    },
    {
      name: 'Vikramaditya Rao',
      role: 'Lead Aptitude & Speed Math Master Trainer',
      bio: 'Author of speed mathematics handbooks with 10+ years coaching for TCS NQT, CAT, and corporate cognitive rounds. Specialist in Vedic mental calculations and option elimination.',
      expertise: 'Quantitative Aptitude, Syllogisms, Analytical Logic',
    },
    {
      name: 'Ananya Deshmukh',
      role: 'Director of Corporate Grooming & Mock Panels',
      bio: 'Former Senior HR Business Partner and Campus Talent Acquisition Lead at tier-1 IT services MNCs. Has evaluated 20,000+ candidate resumes and led 100+ campus drives.',
      expertise: 'ATS Resume Engineering, Behavioral STAR Mocks, GD Dynamics',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-100/60 px-3 py-1 rounded-full">
            Our Mission & Pedigree
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Bridging College Academics &amp; Corporate Placement Bars
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            CampusEdge was founded on a simple realization: Indian engineering students don&apos;t lack intelligence—they lack exposure to high-pressure competitive coding patterns and structured interview frameworks.
          </p>
        </div>

        {/* Philosophy Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-12 mb-16 shadow-sm">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">The Pedagogical Core</span>
            <h2 className="text-2xl font-black text-slate-900">
              The 20-80 Active Coding Philosophy
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Traditional training vendors deploy PowerPoint presentations where an instructor lectures to 150 passive students. By minute 25, student attention drops, coding phobia increases, and retention falls below 20%.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              At CampusEdge, we mandate the <strong>20-80 active coding model</strong>: 20 minutes of intense whiteboard concept breakdown, followed by 80 minutes of proctored, hands-on coding on real interview problems. Students submit working code with live leaderboard feedback before leaving the room.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 mt-8 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xl font-black text-slate-900">1:30</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Lab TA-to-Student Ratio</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xl font-black text-slate-900">100%</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Vetted Ex-Industry Instructors</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xl font-black text-slate-900">48h</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Guaranteed Trainer Replacement SLA</div>
            </div>
          </div>
        </div>

        {/* Leadership & Trainers */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-black text-slate-900">Our Academic &amp; Technical Leadership</h2>
            <p className="text-xs text-slate-600 mt-2">
              Combining Silicon Valley engineering pedigree with decades of Indian university placement governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trainers.map((tr) => (
              <div
                key={tr.name}
                className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{tr.name}</h3>
                  <div className="text-xs font-semibold text-sky-600 mt-0.5">{tr.role}</div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-3">{tr.bio}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-[11px] font-medium text-slate-500">
                  <span className="font-bold text-slate-800">Specialization:</span> {tr.expertise}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-slate-900 rounded-3xl p-10 text-white space-y-4">
          <h3 className="text-2xl font-bold">Invite our trainers to your campus</h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Experience our instructors in action during a complimentary 90-minute masterclass for your students.
          </p>
          <div className="pt-2">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-colors"
            >
              Book Masterclass or Pilot <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
