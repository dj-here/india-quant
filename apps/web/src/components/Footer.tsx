import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-black text-base">
                CE
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Campus<span className="text-sky-400">Edge</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Company-standard institutional technical finishing school and placement acceleration partner for engineering and degree colleges across India.
            </p>
            <div className="flex flex-wrap gap-2 text-xs pt-1">
              <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-emerald-400 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" /> NAAC Criterion 5.1.3
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-sky-400 px-2.5 py-1 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" /> NBA Criterion 4 & 5
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-md">
                GST SAC: 999293
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">Training Tracks</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/programs#dsa" className="hover:text-white transition-colors">
                  DSA & Competitive Coding
                </Link>
              </li>
              <li>
                <Link href="/programs#aptitude" className="hover:text-white transition-colors">
                  Speed Quantitative Aptitude
                </Link>
              </li>
              <li>
                <Link href="/programs#soft-skills" className="hover:text-white transition-colors">
                  Corporate Soft Skills & GD
                </Link>
              </li>
              <li>
                <Link href="/programs#mocks" className="hover:text-white transition-colors">
                  1-on-1 Panel Mock Interviews
                </Link>
              </li>
              <li>
                <Link href="/assessment" className="text-sky-400 hover:text-sky-300 font-medium">
                  Free Student Readiness Test →
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Packages */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">For Colleges</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/packages" className="hover:text-white transition-colors">
                  Packages & Pricing (INR)
                </Link>
              </li>
              <li>
                <Link href="/packages#pilot" className="text-emerald-400 hover:text-emerald-300 font-medium">
                  2-Week Pilot Offer (₹25,000)
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  Pilot-to-Contract Process
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  TPO & Principal FAQs
                </Link>
              </li>
              <li>
                <Link href="/demo" className="text-sky-400 hover:text-sky-300 font-medium">
                  Book 90-Min Masterclass →
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">T&P Desk Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <a href="tel:+916366214556" className="hover:text-white transition-colors">
                    +91 63662 14556
                  </a>
                  <p className="text-[11px] text-slate-500">Mon-Sat, 9am - 7pm IST</p>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <a href="mailto:dj0791463@gmail.com" className="hover:text-white transition-colors">
                  dj0791463@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-400">
                  Bengaluru & Pune Operations Hubs, India
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} CampusEdge EdTech Private Limited. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy Policy (DPDP Act 2023)
            </Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              Institutional Terms of Service
            </Link>
            <Link href="/admin/login" className="hover:text-slate-400 transition-colors">
              Staff Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
