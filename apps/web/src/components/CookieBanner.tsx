'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('kidsmentor_cookie_notice');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('kidsmentor_cookie_notice', 'acknowledged');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-slate-800 text-xs">
      <div className="flex items-start space-x-3 mb-3">
        <ShieldCheck className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block mb-1">Zero Behavioral Tracking</span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            In strict compliance with Section 9 of the India DPDP Act 2023, KidsMentor uses <strong>strictly essential cookies</strong> for parent session security. We never use advertising, tracking, or profiling cookies. See our{' '}
            <Link href="/privacy" className="text-amber-400 hover:underline">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
        <button
          onClick={handleDismiss}
          className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
