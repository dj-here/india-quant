import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  CalendarCheck,
  Laptop,
  BarChart3,
  FileCheck2,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works | Zero-Burden Institutional Delivery',
  description:
    'Learn how CampusEdge integrates seamlessly into your college timetable, sets up lab environments, and dispatches weekly Monday MIS reports.',
};

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Curriculum & Timetable Alignment',
      desc: 'Our academic coordinator meets with your TPO and HoDs to map training hours around university exams, practicals, and internal tests. Zero disruption to mandatory credit lectures.',
      tag: 'Academic Sync',
    },
    {
      num: '02',
      title: 'Lab Pre-Flight & Compiler Setup',
      desc: 'Our technical team verifies your campus computer laboratories 48 hours before batch launch. Compilers for Java 21, C++20, and Python 3.11 are tested with offline problem mirrors.',
      tag: 'Infrastructure',
    },
    {
      num: '03',
      title: '20-80 Active Learning Delivery',
      desc: 'Lead trainers and lab teaching assistants guide students through 20 minutes of concept breakdown followed by 80 minutes of proctored live coding with instant leaderboard feedback.',
      tag: 'Pedagogy',
    },
    {
      num: '04',
      title: 'Monday 9 AM Executive MIS Reports',
      desc: 'Every Monday morning, the Principal, TPO, and HoDs receive an automated PDF summary detailing section attendance, coding scores, defaulter alerts, and remedial recommendations.',
      tag: 'Transparent Analytics',
    },
    {
      num: '05',
      title: '1-on-1 Panel Mocks & Grand Mock Drive',
      desc: 'Students undergo individualized 30-minute technical and HR mock rounds with external industry leads, followed by a simulated grand campus recruitment drive.',
      tag: 'Finishing School',
    },
    {
      num: '06',
      title: 'NAAC & NBA Audit Dossier Dispatch',
      desc: 'Upon program conclusion, we provide tamper-proof digital certificates with QR verification, alongside complete data tables directly formatted for NBA Criterion 4 and NAAC 5.1.3.',
      tag: 'Accreditation Ready',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-100/60 px-3 py-1 rounded-full">
            Autonomous Turnkey Model
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            How CampusEdge Works with Your College
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            We know how busy college faculty and placement teams are. Our turnkey operational framework eliminates administrative burden from start to finish.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {steps.map((s) => (
            <div
              key={s.num}
              className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-sky-600">{s.num}</span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    {s.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Flexible Delivery Schedules */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-12 mb-16 shadow-sm">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Operational Flexibility</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Three Flexible Scheduling Formats to Fit Your Timetable
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              We adjust to your academic calendar so students never have to choose between semester credits and placement preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Integrated Semester Mode</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                4 to 6 hours per week scheduled on Friday/Saturday afternoons or designated departmental zero-hour slots throughout the 16-week semester.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Interactive Hybrid Mode</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                60% in-person weekend lab clinics combined with 40% evening live virtual coding challenges and doubt clearing sessions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Vacation Crash Bootcamp</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                High-intensity 10 to 15 day daily bootcamps (6-8 hours/day) conducted during summer (May-July) or winter semester breaks immediately before hiring season.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-slate-900 rounded-3xl p-10 text-white space-y-4">
          <h3 className="text-2xl font-bold">Have a specific timetable constraint at your campus?</h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Our Program Director will design a custom timetable roadmap for your college within 24 hours.
          </p>
          <div className="pt-2">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-colors"
            >
              Discuss Timetable Alignment <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
