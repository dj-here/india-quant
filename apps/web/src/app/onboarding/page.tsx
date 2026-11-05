'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Smile, 
  Lock, 
  Clock, 
  Sparkles, 
  User, 
  AlertCircle 
} from 'lucide-react';
import { AVATAR_OPTIONS, SUPPORTED_LANGUAGES, EDUCATIONAL_BOARDS, AGE_BANDS } from '@/lib/constants';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Parent & Consent
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  // Step 2: Child Profile
  const [nickname, setNickname] = useState('');
  const [ageBand, setAgeBand] = useState<'6-8' | '9-12' | '13-16'>('9-12');
  const [grade, setGrade] = useState(6);
  const [board, setBoard] = useState('CBSE');
  const [language, setLanguage] = useState<'en' | 'hi' | 'te'>('en');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Space', 'Cricket']);
  const [selectedAvatar, setSelectedAvatar] = useState('owl_curious');
  const [pin, setPin] = useState('1234');
  const [dailyLimit, setDailyLimit] = useState(30);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const interestOptions = ['Space', 'Cricket', 'Robotics', 'Animals', 'Drawing', 'Music', 'Puzzles', 'Cooking'];

  const toggleInterest = (item: string) => {
    if (selectedInterests.includes(item)) {
      setSelectedInterests(selectedInterests.filter(i => i !== item));
    } else {
      setSelectedInterests([...selectedInterests, item]);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      // In a live environment, POST to /api/auth/register-parent and /api/children
      // Mocked local success state
      setTimeout(() => {
        setSubmitting(false);
        setSuccess(true);
      }, 900);
    } catch (e) {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
            step >= 1 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-600'
          }`}>
            1
          </div>
          <span className="text-[11px] font-semibold text-slate-600 mt-1">Parent Consent</span>
        </div>
        <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-amber-400' : 'bg-slate-200'}`} />
        <div className="flex flex-col items-center">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
            step >= 2 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-600'
          }`}>
            2
          </div>
          <span className="text-[11px] font-semibold text-slate-600 mt-1">Child Profile</span>
        </div>
        <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-amber-400' : 'bg-slate-200'}`} />
        <div className="flex flex-col items-center">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
            step >= 3 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-600'
          }`}>
            3
          </div>
          <span className="text-[11px] font-semibold text-slate-600 mt-1">AI Tutor Intro</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-md">
        
        {/* STEP 1: Parent & Consent */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verifiable Parental Consent (DPDP Act 2023 Sec 9)</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Parent / Guardian Account</h2>
              <p className="text-xs text-slate-600 mt-1">
                Under the India Digital Personal Data Protection Act 2023 and COPPA, parents hold sovereign control over their child’s profile and data.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parent Full Name</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parent Email</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Password</label>
                <input
                  type="password"
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Statutory Consent Box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 space-y-2">
              <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-700" /> Mandatory Parental Consent Notice:
              </h4>
              <p className="leading-relaxed">
                By ticking below, I verify that I am the parent or lawful guardian of the child. I consent to their educational interaction with the KidsMentor AI tutor ("Ollie"). I understand that:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Ollie is an artificial intelligence computer program, not a human teacher.</li>
                <li>No child phone number or email is ever collected or requested.</li>
                <li>I can inspect all conversation transcripts, prompt versions, and safety verdicts anytime.</li>
                <li>I can permanently delete or export all records with 1 click under DPDP Act 2023.</li>
              </ul>
              <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-900">
                  I give my verifiable parental consent and accept the Terms & Privacy Policy.
                </span>
              </label>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!consentGiven || !parentEmail || !parentName}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>Continue to Child Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Child Profile */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-black text-slate-900">Create Learner Profile</h2>
              <p className="text-xs text-slate-600 mt-1">
                Data Minimization: We collect only a first name or nickname. No surnames or phone numbers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Child's Nickname / First Name</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Rohan"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age Band</label>
                <div className="grid grid-cols-3 gap-2">
                  {AGE_BANDS.map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setAgeBand(band)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                        ageBand === band ? 'bg-amber-500 text-slate-950 border-amber-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {band} yrs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Class / Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Educational Board</label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {EDUCATIONAL_BOARDS.map((b) => (
                    <option key={b.code} value={b.code}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Language of Instruction</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label} ({l.nativeName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Child 4-Digit Login PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Mascot / Avatar</label>
              <div className="flex flex-wrap gap-3">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
                      selectedAvatar === av.id ? 'bg-amber-100 border-amber-400 text-amber-950 scale-105' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-xl">{av.emoji}</span>
                    <span>{av.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interests multi-select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Interests (Ollie uses these in examples)</label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      selectedInterests.includes(item)
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily limit slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Daily AI Tutoring Limit
                </label>
                <span className="text-xs font-extrabold text-amber-700">{dailyLimit} Minutes / Day</span>
              </div>
              <input
                type="range"
                min={15}
                max={60}
                step={5}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-[11px] text-slate-500">Enforces healthy digital screen habits and offline family life.</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!nickname || pin.length !== 4}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Preview AI Tutor Introduction</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Honest AI Intro & Mascot Handshake */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-3xl mx-auto flex items-center justify-center text-5xl shadow-inner border border-amber-300">
              🦉
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                AI Tutor Onboarding Greeting
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-2">
                "Hello, {nickname || 'Friend'}! I'm Ollie."
              </h2>
            </div>

            {/* Honest AI Greeting Card */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 text-left space-y-3 text-xs leading-relaxed max-w-xl mx-auto">
              <p className="font-semibold text-slate-800">
                Here is what Ollie tells your child during their first session:
              </p>
              <div className="p-4 bg-white rounded-2xl border border-amber-100 text-slate-700 italic space-y-2">
                <p>
                  "I am an artificial intelligence helper, NOT a human being. I don't have a body, a family, or human feelings, but I love solving maths puzzles, exploring science, and learning life values with you!"
                </p>
                <p>
                  "I won't just give you the answers right away—I’ll ask you gentle questions so you can discover the answers for yourself. Whenever we learn about kindness or honesty, I’ll give you a real mission to practice with your real family and friends!"
                </p>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                Child Login PIN configured: <strong className="font-mono text-slate-800">{pin}</strong>. You can change this anytime from your Parent Dashboard.
              </div>
            </div>

            {success ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 font-bold text-sm">
                🎉 Account & Child Profile Created Successfully!
                <div className="mt-3 flex justify-center gap-3">
                  <Link
                    href="/child/home"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
                  >
                    Launch Child Learning Hub &rarr;
                  </Link>
                  <Link
                    href="/parent/dashboard"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs"
                  >
                    Open Parent Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submitting ? 'Setting up...' : 'Confirm & Launch KidsMentor'}</span>
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
