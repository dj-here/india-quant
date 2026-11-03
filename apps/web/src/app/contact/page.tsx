import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | Institutional Partnerships Desk',
  description:
    'Connect with the CampusEdge TPO Partnerships Desk. Bengaluru and Pune operations hubs. Direct phone and WhatsApp support for college leaders.',
};

export default function ContactPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-100/60 px-3 py-1 rounded-full">
            Direct T&amp;P Assistance
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Connect with Our Institutional Desk
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Whether you need a confidential placement readiness audit, syllabus customization, or pilot dates, our Academic Directors are ready to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Col: Contact Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
                Headquarters &amp; Hubs
              </h2>

              <div className="space-y-5 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Direct Line &amp; WhatsApp</h3>
                    <p className="mt-0.5"><a href="tel:+916366214556" className="hover:text-sky-600 font-semibold">+91 63662 14556</a></p>
                    <p className="text-slate-400 mt-1">Available Mon – Sat, 9:00 AM – 7:00 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Official Email Desk</h3>
                    <p className="mt-0.5"><a href="mailto:dj0791463@gmail.com" className="hover:text-sky-600 font-semibold">dj0791463@gmail.com</a></p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Operations Bases</h3>
                    <p className="mt-0.5 font-medium text-slate-800">Bengaluru Hub (Corporate):</p>
                    <p>#402, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103</p>
                    <p className="mt-2 font-medium text-slate-800">Pune Hub (West India Operations):</p>
                    <p>Tower 3, Senapati Bapat Road, Shivajinagar, Pune, Maharashtra 411016</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900 text-white p-8 space-y-4">
              <h3 className="text-lg font-bold">Fastest Response via WhatsApp</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect with our Senior Program Lead immediately on WhatsApp to discuss batch sizes and get our 1-page institutional brochure.
              </p>
              <a
                href="https://wa.me/916366214556?text=Hi%20CampusEdge,%20we%20would%20like%20to%20know%20more%20about%20college%20placement%20training."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Open WhatsApp Chat
              </a>
            </div>
          </div>

          {/* Right Col: Quick Pitch & Link to Demo Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 lg:p-10 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Formal College Inquiries</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                Request a Free 90-Minute Masterclass or Pilot Proposal
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                If you are a College Principal, TPO, Dean, or Department HoD seeking a structured training proposal for your students, please use our comprehensive institutional request form.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">What Happens Next:</strong> Our Academic Director reviews your university regulations, prepares a customized syllabus mapping, and connects with you within 24 business hours.
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  Go to Free Demo / Proposal Request Form <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
