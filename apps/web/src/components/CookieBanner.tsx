'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('pawstay_cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('pawstay_cookie_consent', 'accepted');
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('pawstay_cookie_consent', 'essential_only');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-slate-800 text-xs">
      <div className="flex items-start space-x-3 mb-3">
        <Cookie className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block mb-1">Cookie & Privacy Notice</span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            We use essential cookies to maintain secure sessions, process escrow payments, and enforce safety standards. By clicking &quot;Accept All&quot;, you consent to analytics cookies under our{' '}
            <Link href="/privacy" className="text-emerald-400 hover:underline">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
        <button
          onClick={handleDecline}
          className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition"
        >
          Essential Only
        </button>
        <button
          onClick={handleAccept}
          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
