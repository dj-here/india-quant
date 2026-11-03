'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, ArrowRight, Phone } from 'lucide-react';

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'COLLEGES' | 'CURRICULUM' | 'COMMERCIALS'>('ALL');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'COLLEGES',
      question: 'How does CampusEdge integrate with our college timetable without disrupting university syllabus?',
      answer: 'We provide three flexible models: 1) Integrated semester mode (4-6 hours weekly during Friday/Saturday zero-hour or lab slots), 2) Early morning or evening hybrid interactive sessions, or 3) Intensive 10-15 day vacation bootcamps during semester breaks. We never interrupt mandatory university theory lectures.'
    },
    {
      category: 'COLLEGES',
      question: 'How does this training support our NAAC and NBA accreditation audits?',
      answer: 'CampusEdge training directly satisfies NBA Criterion 4 (Students’ Performance & Placements) and NAAC Criterion 5.1.3 (Capacity Building & Skills Enhancement). We provide signed trainer attendance logs, pre/post evaluation deltas, and tamper-proof digital certificates ready for DVV audits.'
    },
    {
      category: 'COLLEGES',
      question: 'What is the required computer laboratory infrastructure at our campus?',
      answer: 'The college provides 1 functioning computer per student with basic internet (min 50 Mbps), modern web browser, and compilers for Java 17+, Python 3.11, or GCC/G++. CampusEdge also provides offline Docker mirrors so training continues seamlessly even during internet interruptions.'
    },
    {
      category: 'CURRICULUM',
      question: 'Which programming languages are supported in the Data Structures & Algorithms track?',
      answer: 'We support Java (Collections Framework / JDK 21), C++ (STL / C++20), and Python (Python 3.11). While core algorithmic thinking is language-agnostic, students practice in the specific idiomatic language favored by their target recruiters.'
    },
    {
      category: 'CURRICULUM',
      question: 'Can non-CS students (ECE, EEE, Mechanical) participate in this training?',
      answer: 'Yes! Over 35% of students in our partner cohorts belong to circuit and core branches. Our 120-hour Foundation track begins from syntax fundamentals, logic formulation, and visual memory diagrams, enabling non-CS students to clear IT service and core tech hiring rounds.'
    },
    {
      category: 'CURRICULUM',
      question: 'How do you conduct the 1-on-1 mock interviews?',
      answer: 'Each student is assigned a dedicated 30-minute private slot with an external industry interviewer. The panel reviews the student’s resume, conducts live algorithmic problem solving on a shared whiteboard, asks behavioral questions, and issues a written diagnostic scorecard.'
    },
    {
      category: 'COMMERCIALS',
      question: 'What is the 2-Week Pilot guarantee and how does the fee credit work?',
      answer: 'Our 2-Week Placement Kickstart Pilot delivers 20 contact hours for a batch of 60 students at a nominal ₹25,000 + GST. If your institution moves forward with a semester contract, 100% of this pilot fee is deducted as an advance discount from your first invoice.'
    },
    {
      category: 'COMMERCIALS',
      question: 'What are your standard milestone payment terms?',
      answer: 'We operate on a 3-stage milestone framework: 30% mobilization advance upon signing of MoU, 40% at the mid-term assessment milestone (50% hours completed), and 30% upon completion of all syllabus hours and submission of final placement readiness dossiers.'
    },
    {
      category: 'COMMERCIALS',
      question: 'What is the GST treatment and TDS deduction on your invoices?',
      answer: 'We bill under SAC Code 999293 (Commercial training and coaching services) with 18% GST. Institutions registered under GST can claim full Input Tax Credit (ITC). TDS is typically deducted under Section 194J or 194C as per prevailing tax regulations.'
    }
  ];

  const filteredFaqs = activeCategory === 'ALL'
    ? faqs
    : faqs.filter(f => f.category === activeCategory);

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-100/60 px-3 py-1 rounded-full">
            Frequently Asked Questions
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Institutional Clarity for College Leaders
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Everything you need to know about timetable integration, accreditation compliance, trainer allocations, and commercial terms.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(['ALL', 'COLLEGES', 'CURRICULUM', 'COMMERCIALS'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setOpenIndex(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat === 'ALL' ? 'All Questions' : cat === 'COLLEGES' ? 'For Colleges & TPOs' : cat === 'CURRICULUM' ? 'Curriculum & DSA' : 'Commercials & Billing'}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4 mb-16">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left py-4 px-6 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm hover:text-sky-600"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-sky-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-slate-600 text-xs leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Strip */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Have a question not listed here?</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Our TPO Support Desk is available from 9 AM to 7 PM IST to assist with syllabus customization and pilot scheduling.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="https://wa.me/919820144550"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> WhatsApp Support (+91 98201 44550)
            </a>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Request Institutional Proposal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
