'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  BookOpen, 
  HeartHandshake, 
  ShieldCheck, 
  User, 
  Menu, 
  X, 
  PhoneCall,
  Settings
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isChildArea = pathname?.startsWith('/child');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-amber-100 shadow-sm">
      {/* Honest AI Banner / Safety Strip */}
      <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-medium flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              <strong>Ollie is an AI Tutor:</strong> No human teacher is in this chat. Ollie is here to help you think!
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-amber-950/80">
              <PhoneCall className="w-3 h-3" /> Childline India: <strong>1098</strong>
            </span>
            <span className="text-amber-900/60">|</span>
            <span className="bg-amber-600/20 px-2 py-0.5 rounded text-[11px] font-semibold text-amber-950">
              DPDP Act 2023 Compliant
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
            🦉
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-800">KidsMentor</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                AI Tutor
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Socratic Academics & Life Values</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {isChildArea ? (
            <>
              <Link 
                href="/child/home" 
                className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                  pathname === '/child/home' ? 'bg-amber-100 text-amber-900' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                Today's Plan
              </Link>
              <Link 
                href="/child/tutor" 
                className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                  pathname === '/child/tutor' ? 'bg-indigo-100 text-indigo-900' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                1-on-1 with Ollie
              </Link>
              <Link 
                href="/child/values" 
                className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                  pathname === '/child/values' ? 'bg-emerald-100 text-emerald-900' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                Character Garden
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/#features" 
                className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                How Ollie Teaches
              </Link>
              <Link 
                href="/#curriculum" 
                className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Academics & Values
              </Link>
              <Link 
                href="/#safety" 
                className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Safety Architecture
              </Link>
            </>
          )}

          <div className="h-5 w-px bg-slate-200 mx-2" />

          {/* Role Portals */}
          <Link
            href="/parent/dashboard"
            className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${
              pathname?.startsWith('/parent') ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            Parent Zone
          </Link>

          <Link
            href="/admin"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Educator & Safety Reviewer Portal"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <Link
            href="/child/login"
            className="ml-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-sm transition-all hover:shadow"
          >
            Child Login (PIN)
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <Link 
            href="/child/home" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            🌟 Today's Plan
          </Link>
          <Link 
            href="/child/tutor" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            🦉 1-on-1 with Ollie
          </Link>
          <Link 
            href="/child/values" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            🌻 Character Garden
          </Link>
          <div className="h-px bg-slate-200 my-2" />
          <Link 
            href="/parent/dashboard" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            👨‍👩‍👧 Parent Dashboard
          </Link>
          <Link 
            href="/admin" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            🛡️ Content & Safety Review
          </Link>
          <Link 
            href="/child/login" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm mt-3"
          >
            Child PIN Login
          </Link>
        </div>
      )}
    </header>
  );
}
