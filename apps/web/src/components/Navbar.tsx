'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, Phone, ShieldCheck, Award } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Programs', href: '/programs' },
    { name: 'Packages & Pricing', href: '/packages' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Readiness Test', href: '/assessment', highlight: true },
    { name: 'About', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
  ];

  const isAdminRoute = pathname?.startsWith('/admin');
  if (isAdminRoute) {
    return null; // Admin has its own dedicated shell
  }

  return (
    <>
      {/* Top Notification / Trust Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> NAAC Criterion 5.1.3 & NBA Criterion 4 Compliant
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">Trusted by 40+ Engineering & Degree Colleges</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <a
              href="https://wa.me/919820144550"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-medium"
            >
              <Phone className="w-3 h-3 text-emerald-400" /> TPO Desk: +91 98201 44550
            </a>
            <Link href="/admin/login" className="hover:text-white transition-colors text-slate-400">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-600/20">
                CE
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                  Campus<span className="text-sky-600">Edge</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                  EdTech Solutions
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      link.highlight
                        ? 'text-sky-700 bg-sky-50 px-3 py-1.5 rounded-full hover:bg-sky-100 font-semibold'
                        : isActive
                        ? 'text-sky-600 font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTA Action Button */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-all hover:shadow-sky-600/25 active:scale-95"
              >
                Request Free Demo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {isOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    link.highlight
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : pathname === link.href
                      ? 'bg-slate-100 text-sky-600 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/demo"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-sky-600 text-white font-semibold text-sm shadow-sm"
              >
                Request Free Demo / Proposal
              </Link>
              <Link
                href="/assessment"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-slate-100 text-slate-800 font-semibold text-sm"
              >
                Try Free Student Assessment
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
