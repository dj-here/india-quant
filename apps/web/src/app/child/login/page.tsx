'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Delete, Sparkles, User, ShieldCheck } from 'lucide-react';

export default function ChildLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const verifyPin = (enteredPin: string) => {
    setLoading(true);
    // Demo PINs: 1234, 4321, 0000, 9999
    setTimeout(() => {
      setLoading(false);
      // Automatically redirect to child home
      router.push('/child/home');
    }, 600);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md text-center flex-1 flex flex-col justify-center">
      {/* Mascot Header */}
      <div className="w-20 h-20 rounded-3xl bg-amber-100 border border-amber-300 mx-auto flex items-center justify-center text-4xl shadow-md mb-4 animate-bounce">
        🦉
      </div>

      <h1 className="text-2xl font-black text-slate-900">Welcome Back, Learner!</h1>
      <p className="text-xs text-slate-600 mt-1 mb-6">
        Enter your 4-digit secret PIN to enter your learning room.
      </p>

      {/* PIN Dots Display */}
      <div className="flex justify-center gap-4 mb-8">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              pin.length > idx
                ? 'bg-amber-500 border-amber-600 scale-110 shadow-sm'
                : 'bg-white border-slate-300'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="text-xs font-bold text-rose-600 mb-4 animate-shake">
          Incorrect PIN. Ask your parent for help!
        </div>
      )}

      {/* Num Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleKeyPress(n.toString())}
            disabled={loading}
            className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-800 text-2xl font-black shadow-sm hover:bg-amber-50 hover:border-amber-300 active:scale-95 transition-all mx-auto flex items-center justify-center"
          >
            {n}
          </button>
        ))}

        <div className="flex items-center justify-center">
          <Link
            href="/onboarding"
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
          >
            New Here?
          </Link>
        </div>

        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          disabled={loading}
          className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-800 text-2xl font-black shadow-sm hover:bg-amber-50 hover:border-amber-300 active:scale-95 transition-all mx-auto flex items-center justify-center"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          disabled={loading || pin.length === 0}
          className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-200 active:scale-95 transition-all mx-auto flex items-center justify-center"
          aria-label="Delete"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 pt-2">
        <Link
          href="/child/home"
          className="text-xs font-bold text-amber-700 hover:text-amber-800 underline"
        >
          Skip to Demo Learner Dashboard &rarr;
        </Link>

        <div className="text-[11px] text-slate-400">
          Parents: manage PINs or view transcripts in the{' '}
          <Link href="/parent/dashboard" className="text-slate-600 font-semibold underline">
            Parent Zone
          </Link>
        </div>
      </div>
    </div>
  );
}
