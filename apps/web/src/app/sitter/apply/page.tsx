'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  SAFETY_QUIZ_QUESTIONS,
  evaluateSafetyQuiz,
  SafetyQuizEvaluation,
} from '@pawstay/shared';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Home,
  User,
  DollarSign,
  FileBadge,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export default function SitterApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Form State
  const [headline, setHeadline] = useState('Passionate, certified pet lover with fenced yard & 24/7 attention');
  const [bio, setBio] = useState(
    'I have cared for dogs and cats for over 6 years. Your furry companion will receive individualized attention, daily park walks, cuddles, and photo updates every morning and evening. Comfortable with medication and senior care.'
  );
  const [yearsOfExperience, setYearsOfExperience] = useState(6);
  const [acceptedPetSpecies, setAcceptedPetSpecies] = useState<('DOG' | 'CAT')[]>(['DOG', 'CAT']);
  const [maxPetCapacity, setMaxPetCapacity] = useState(2);
  const [hasMedicationExperience, setHasMedicationExperience] = useState(true);
  const [hasPuppyExperience, setHasPuppyExperience] = useState(true);
  const [hasSeniorExperience, setHasSeniorExperience] = useState(true);
  const [instantBookEnabled, setInstantBookEnabled] = useState(false);
  const [cancellationPolicy, setCancellationPolicy] = useState<'FLEXIBLE' | 'MODERATE' | 'STRICT'>('MODERATE');

  // Home Profile
  const [addressLine1, setAddressLine1] = useState('1400 Congress Ave');
  const [city, setCity] = useState('Austin');
  const [state, setState] = useState('TX');
  const [postalCode, setPostalCode] = useState('78701');
  const [homeType, setHomeType] = useState<'HOUSE' | 'APARTMENT' | 'CONDO'>('HOUSE');
  const [hasFencedYard, setHasFencedYard] = useState(true);
  const [yardSize, setYardSize] = useState<'NONE' | 'SMALL' | 'MEDIUM' | 'LARGE'>('LARGE');
  const [hasOtherPetsInHome, setHasOtherPetsInHome] = useState(false);
  const [hasChildrenInHome, setHasChildrenInHome] = useState(false);
  const [isSmokingFree, setIsSmokingFree] = useState(true);
  const [allowsPetsOnFurniture, setAllowsPetsOnFurniture] = useState(true);

  // Services & Rates
  const [services, setServices] = useState([
    {
      serviceType: 'BOARDING',
      isActive: true,
      baseRateDollars: 55,
      additionalPetRateDollars: 25,
      holidaySurchargeDollars: 15,
      puppySurchargeDollars: 10,
      extendedStayDiscountPercent: 10,
    },
    {
      serviceType: 'HOUSE_SITTING',
      isActive: true,
      baseRateDollars: 65,
      additionalPetRateDollars: 30,
      holidaySurchargeDollars: 20,
      puppySurchargeDollars: 10,
      extendedStayDiscountPercent: 15,
    },
    {
      serviceType: 'DROP_IN',
      isActive: true,
      baseRateDollars: 28,
      additionalPetRateDollars: 12,
      holidaySurchargeDollars: 8,
      puppySurchargeDollars: 5,
      extendedStayDiscountPercent: 0,
    },
    {
      serviceType: 'DAY_CARE',
      isActive: true,
      baseRateDollars: 40,
      additionalPetRateDollars: 20,
      holidaySurchargeDollars: 10,
      puppySurchargeDollars: 5,
      extendedStayDiscountPercent: 5,
    },
    {
      serviceType: 'WALKING',
      isActive: true,
      baseRateDollars: 25,
      additionalPetRateDollars: 10,
      holidaySurchargeDollars: 5,
      puppySurchargeDollars: 5,
      extendedStayDiscountPercent: 0,
    },
  ]);

  // Verification & Safety Quiz
  const [documentType, setDocumentType] = useState<'PASSPORT' | 'DRIVERS_LICENSE' | 'STATE_ID'>('DRIVERS_LICENSE');
  const [bgConsent, setBgConsent] = useState(true);

  // Quiz Answers (Initialize with perfect answers so user can easily review or test mistakes)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const q of SAFETY_QUIZ_QUESTIONS) {
      initial[q.id] = q.correctOptionIndex; // Pre-select correct answer by default with ability to change
    }
    return initial;
  });

  const [quizEval, setQuizEval] = useState<SafetyQuizEvaluation | null>(null);

  const handleQuizAnswer = (questionId: string, optionIndex: number) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleRunQuizCheck = () => {
    const formatted = Object.entries(quizAnswers).map(([k, v]) => ({
      questionId: k,
      selectedOptionIndex: v,
    }));
    const result = evaluateSafetyQuiz(formatted);
    setQuizEval(result);
    return result;
  };

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    // Run quiz verification
    const evalResult = handleRunQuizCheck();
    if (!evalResult.passed) {
      setSubmissionError(
        'You have not passed the mandatory safety quiz. Please review the highlighted questions below to pass (requires >= 80% and all mandatory questions correct).'
      );
      setStep(5);
      setIsSubmitting(false);
      return;
    }

    try {
      const activeServices = services
        .filter((s) => s.isActive)
        .map((s) => ({
          serviceType: s.serviceType as any,
          isActive: true,
          baseRateMinor: Math.round(s.baseRateDollars * 100),
          additionalPetRateMinor: Math.round(s.additionalPetRateDollars * 100),
          holidaySurchargeMinor: Math.round(s.holidaySurchargeDollars * 100),
          puppySurchargeMinor: Math.round(s.puppySurchargeDollars * 100),
          extendedStayDiscountPercent: s.extendedStayDiscountPercent,
        }));

      const payload = {
        sitterData: {
          headline,
          bio,
          yearsOfExperience,
          addressLine1,
          city,
          state,
          postalCode,
          country: 'USA',
          latitude: 30.2672,
          longitude: -97.7431,
          cancellationPolicy,
          services: activeServices,
          homeProfile: {
            homeType,
            hasFencedYard,
            yardSize,
            hasOtherPetsInHome,
            otherPetsDetails: '',
            hasChildrenInHome,
            isSmokingFree,
            allowsPetsOnFurniture,
            photos: [
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
            ],
          },
          acceptedPetSpecies,
          maxPetCapacity,
          hasExperienceWithMedication: hasMedicationExperience,
          hasExperienceWithPuppies: hasPuppyExperience,
          hasExperienceWithSeniors: hasSeniorExperience,
          instantBookEnabled,
        },
        quizAnswers: Object.entries(quizAnswers).map(([k, v]) => ({
          questionId: k,
          selectedOptionIndex: v,
        })),
        documentType,
        documentFrontUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
        selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      };

      const res = await fetch('/api/sitter/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit sitter application');
      }

      router.push('/sitter/dashboard?applied=true');
    } catch (err: any) {
      setSubmissionError(err.message || 'An error occurred while submitting your application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Profile & Experience', icon: User },
    { num: 2, label: 'Home & Yard', icon: Home },
    { num: 3, label: 'Services & Rates', icon: DollarSign },
    { num: 4, label: 'Identity & Vetting', icon: FileBadge },
    { num: 5, label: 'Safety Exam', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
              <Sparkles className="h-3.5 w-3.5" /> PawStay Host Network
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Become a Verified PawStay Sitter
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Set your own schedule, choose your rates, and host loving pets in your area. Every sitter passes our
              mandatory identity check, background vetting, and pet safety examination.
            </p>
          </div>

          {/* Stepper Navigation */}
          <div className="mb-8 grid grid-cols-5 gap-2 border-b border-slate-200 pb-4">
            {stepsList.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  className={`flex flex-col items-center gap-1.5 text-center transition ${
                    isActive
                      ? 'text-emerald-700 font-bold'
                      : isPast
                      ? 'text-slate-700 hover:text-emerald-600'
                      : 'text-slate-400'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : isPast
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="hidden sm:inline text-xs">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Error Banner */}
          {submissionError && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Application Notice</p>
                <p>{submissionError}</p>
              </div>
            </div>
          )}

          {/* Card Container */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {/* STEP 1: Profile & Experience */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Step 1: Profile & Experience</h2>
                  <p className="text-sm text-slate-500">Tell pet parents about your pet care journey and skills.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Profile Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. Caring dog lover with a big fenced yard and work-from-home schedule"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    About You (Bio)
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Describe your background, daily routine, and what pet parents can expect..."
                  />
                  <p className="mt-1 text-xs text-slate-400">Minimum 50 characters.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Max Pet Capacity at Once
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={maxPetCapacity}
                      onChange={(e) => setMaxPetCapacity(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                    Species Accepted
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={acceptedPetSpecies.includes('DOG')}
                        onChange={(e) => {
                          if (e.target.checked) setAcceptedPetSpecies([...acceptedPetSpecies, 'DOG']);
                          else setAcceptedPetSpecies(acceptedPetSpecies.filter((s) => s !== 'DOG'));
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Dogs (All Breeds)
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={acceptedPetSpecies.includes('CAT')}
                        onChange={(e) => {
                          if (e.target.checked) setAcceptedPetSpecies([...acceptedPetSpecies, 'CAT']);
                          else setAcceptedPetSpecies(acceptedPetSpecies.filter((s) => s !== 'CAT'));
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Cats
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                    Specialized Experience
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={hasMedicationExperience}
                        onChange={(e) => setHasMedicationExperience(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Oral & topical medication administration experience
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={hasPuppyExperience}
                        onChange={(e) => setHasPuppyExperience(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Puppy care (potty training schedules, teething management)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={hasSeniorExperience}
                        onChange={(e) => setHasSeniorExperience(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Senior pet care (mobility assistance, frequent bathroom breaks)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Home & Yard */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Step 2: Home & Location</h2>
                  <p className="text-sm text-slate-500">
                    Your exact street address is kept strictly confidential until a booking is paid and confirmed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Home Type</label>
                    <select
                      value={homeType}
                      onChange={(e) => setHomeType(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="HOUSE">Single-Family House</option>
                      <option value="APARTMENT">Apartment</option>
                      <option value="CONDO">Condominium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Fenced Yard?</label>
                    <select
                      value={hasFencedYard ? 'YES' : 'NO'}
                      onChange={(e) => setHasFencedYard(e.target.value === 'YES')}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="YES">Yes, Fully Fenced</option>
                      <option value="NO">No Fenced Yard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Yard Size</label>
                    <select
                      value={yardSize}
                      onChange={(e) => setYardSize(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="NONE">No Yard</option>
                      <option value="SMALL">Small Patio / Yard</option>
                      <option value="MEDIUM">Medium Yard</option>
                      <option value="LARGE">Large Yard</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasOtherPetsInHome}
                      onChange={(e) => setHasOtherPetsInHome(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    I have other personal pets living in the home
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasChildrenInHome}
                      onChange={(e) => setHasChildrenInHome(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Children reside in the home
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={isSmokingFree}
                      onChange={(e) => setIsSmokingFree(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    100% Smoke-free environment
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={allowsPetsOnFurniture}
                      onChange={(e) => setAllowsPetsOnFurniture(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Pets are allowed on furniture and beds
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: Services & Rates */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Step 3: Services & Transparent Pricing</h2>
                  <p className="text-sm text-slate-500">
                    Configure the services you want to provide. All prices are stored in full cents without floating-point errors.
                  </p>
                </div>

                <div className="space-y-4">
                  {services.map((svc, idx) => (
                    <div
                      key={svc.serviceType}
                      className={`rounded-xl border p-4 transition ${
                        svc.isActive ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 font-bold text-slate-900">
                          <input
                            type="checkbox"
                            checked={svc.isActive}
                            onChange={(e) => {
                              setServices((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, isActive: e.target.checked } : s))
                              );
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          {svc.serviceType.replace('_', ' ')}
                        </label>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {svc.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      {svc.isActive && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="font-semibold text-slate-600">Base Rate ($/unit)</span>
                            <div className="relative mt-1">
                              <span className="absolute left-2.5 top-2 text-slate-400">$</span>
                              <input
                                type="number"
                                min={10}
                                max={300}
                                value={svc.baseRateDollars}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setServices((prev) =>
                                    prev.map((s, i) => (i === idx ? { ...s, baseRateDollars: val } : s))
                                  );
                                }}
                                className="w-full rounded-lg border border-slate-300 pl-6 p-2 text-sm focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-600">+ Addl Pet ($)</span>
                            <div className="relative mt-1">
                              <span className="absolute left-2.5 top-2 text-slate-400">$</span>
                              <input
                                type="number"
                                min={0}
                                max={150}
                                value={svc.additionalPetRateDollars}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setServices((prev) =>
                                    prev.map((s, i) => (i === idx ? { ...s, additionalPetRateDollars: val } : s))
                                  );
                                }}
                                className="w-full rounded-lg border border-slate-300 pl-6 p-2 text-sm focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-600">Holiday ($)</span>
                            <div className="relative mt-1">
                              <span className="absolute left-2.5 top-2 text-slate-400">$</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={svc.holidaySurchargeDollars}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setServices((prev) =>
                                    prev.map((s, i) => (i === idx ? { ...s, holidaySurchargeDollars: val } : s))
                                  );
                                }}
                                className="w-full rounded-lg border border-slate-300 pl-6 p-2 text-sm focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-600">Puppy Surcharge ($)</span>
                            <div className="relative mt-1">
                              <span className="absolute left-2.5 top-2 text-slate-400">$</span>
                              <input
                                type="number"
                                min={0}
                                max={50}
                                value={svc.puppySurchargeDollars}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setServices((prev) =>
                                    prev.map((s, i) => (i === idx ? { ...s, puppySurchargeDollars: val } : s))
                                  );
                                }}
                                className="w-full rounded-lg border border-slate-300 pl-6 p-2 text-sm focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Cancellation Policy
                  </label>
                  <select
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value as any)}
                    className="w-full sm:w-1/2 rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="FLEXIBLE">Flexible (100% refund up to 1 day before stay)</option>
                    <option value="MODERATE">Moderate (100% refund up to 5 days, 50% thereafter)</option>
                    <option value="STRICT">Strict (100% refund up to 14 days, 50% thereafter)</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 4: Identity & Vetting */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Step 4: Identity Verification & Background Check</h2>
                  <p className="text-sm text-slate-500">
                    PawStay uses real-time biometric and government credential verification to ensure 100% trust across the marketplace.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <FileBadge className="h-6 w-6 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Government Photo ID Document</h4>
                      <p className="text-xs text-slate-500">Select document to verify identity and match biometrics.</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="radio"
                        name="idDoc"
                        checked={documentType === 'DRIVERS_LICENSE'}
                        onChange={() => setDocumentType('DRIVERS_LICENSE')}
                      />
                      Driver's License
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="radio"
                        name="idDoc"
                        checked={documentType === 'PASSPORT'}
                        onChange={() => setDocumentType('PASSPORT')}
                      />
                      Passport
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="radio"
                        name="idDoc"
                        checked={documentType === 'STATE_ID'}
                        onChange={() => setDocumentType('STATE_ID')}
                      />
                      State ID
                    </label>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center">
                      <p className="text-xs font-bold text-slate-700">Document Front</p>
                      <p className="text-xs text-emerald-600 mt-1">✓ Mock Document Ready</p>
                    </div>
                    <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center">
                      <p className="text-xs font-bold text-slate-700">Biometric Selfie</p>
                      <p className="text-xs text-emerald-600 mt-1">✓ Live Match Sim Ready</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-sm">Criminal & Safety Background Check</h4>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">
                    PawStay runs a comprehensive nationwide criminal history, sex offender registry, and county court record check for all prospective pet sitters.
                  </p>
                  <label className="flex items-start gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={bgConsent}
                      onChange={(e) => setBgConsent(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      I hereby authorize PawStay and its accredited consumer reporting agencies to perform a background check in accordance with FCRA regulations.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 5: Safety Exam */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Step 5: Mandatory Pet Safety Examination</h2>
                      <p className="text-sm text-slate-500">
                        10 questions designed to ensure the safety and welfare of every dog and cat on PawStay.
                      </p>
                    </div>
                    {quizEval && (
                      <div
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          quizEval.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        Score: {quizEval.score}/{quizEval.total} ({quizEval.percentage}%) -{' '}
                        {quizEval.passed ? 'PASSED' : 'NOT PASSED'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {SAFETY_QUIZ_QUESTIONS.map((q, idx) => {
                    const selectedIdx = quizAnswers[q.id];
                    const feedback = quizEval?.feedback.find((f) => f.questionId === q.id);

                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl border p-4 transition ${
                          feedback
                            ? feedback.correct
                              ? 'border-emerald-300 bg-emerald-50/30'
                              : 'border-rose-300 bg-rose-50/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-bold uppercase text-slate-400">
                            Question {idx + 1} of 10 • {q.category}
                            {q.isMandatory && (
                              <span className="ml-2 text-rose-600 font-bold">* Mandatory</span>
                            )}
                          </span>
                          {feedback && (
                            <span
                              className={`text-xs font-bold ${
                                feedback.correct ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {feedback.correct ? '✓ Correct' : '✕ Missed'}
                            </span>
                          )}
                        </div>

                        <p className="font-semibold text-slate-900 text-sm mb-3">{q.question}</p>

                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-start gap-3 rounded-lg border p-3 text-xs cursor-pointer transition ${
                                selectedIdx === optIdx
                                  ? 'border-emerald-600 bg-emerald-50/50 font-medium text-slate-900'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={selectedIdx === optIdx}
                                onChange={() => handleQuizAnswer(q.id, optIdx)}
                                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>

                        {feedback && !feedback.correct && (
                          <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800">
                            <strong>Why this matters: </strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleRunQuizCheck}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Check Quiz Answers Now
                  </button>
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitApplication}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>Submitting Verification...</>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Submit Application for Approval
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
