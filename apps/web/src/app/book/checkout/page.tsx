'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  ShieldCheck,
  CreditCard,
  Lock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Heart,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { formatCentsToDollars } from '@/lib/utils';
import { calculateBookingPrice } from '@pawstay/shared';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sitterId = searchParams.get('sitterId') || '';
  const serviceType = searchParams.get('serviceType') || 'BOARDING';
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0]!;
  const endDate =
    searchParams.get('endDate') ||
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;

  const [sitter, setSitter] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [vetEmergencyDollars, setVetEmergencyDollars] = useState(10000);
  const [isInstantBook, setIsInstantBook] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Indian Payment options
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState('petparent@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('987');

  const nights = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000))
  );

  useEffect(() => {
    // Fetch sitter details
    if (sitterId) {
      fetch(`/api/search?radiusMiles=100&serviceType=${serviceType}`)
        .then((res) => res.json())
        .then((data) => {
          const found = data.sitters?.find((s: any) => s.id === sitterId) || data.sitters?.[0];
          setSitter(found);
          if (found?.instantBookEnabled) {
            setIsInstantBook(true);
          }
        })
        .catch(console.error);
    }

    // Fetch user pets
    fetch('/api/pets')
      .then((res) => res.json())
      .then((data) => {
        const userPets = data.pets || [];
        setPets(userPets);
        if (userPets.length > 0) {
          setSelectedPetIds([userPets[0].id]);
        }
      })
      .catch(console.error);
  }, [sitterId, serviceType]);

  const activeRateMinor = sitter?.service?.baseRateMinor || 5000;
  const quote = calculateBookingPrice({
    baseRateMinor: activeRateMinor,
    unitsCount: nights,
    petCount: Math.max(1, selectedPetIds.length),
    additionalPetRateMinor: 2000,
    extendedStayDiscountPercent: nights >= 7 ? 10 : 0,
  });

  const handleTogglePet = (id: string) => {
    if (selectedPetIds.includes(id)) {
      if (selectedPetIds.length > 1) {
        setSelectedPetIds(selectedPetIds.filter((p) => p !== id));
      }
    } else {
      setSelectedPetIds([...selectedPetIds, id]);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPetIds.length === 0) {
      setErrorMsg('Please select at least one pet for this booking.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        sitterId: sitter?.id || sitterId,
        serviceType,
        startDate,
        endDate,
        petIds: selectedPetIds,
        specialInstructions,
        vetEmergencyAuthorizationMinor: Math.round(vetEmergencyDollars * 100),
        instantBook: isInstantBook,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize booking');
      }

      router.push(`/bookings/${data.bookingId}?confirmed=true`);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during booking checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Complete Your Booking</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Funds are authorized and safely held in escrow until stay completion.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Profile
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Pet Selection, Vet Consent & Payment Card */}
            <form onSubmit={handleCreateBooking} className="space-y-6 lg:col-span-2">
              {/* Pet Selection */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-600" /> Select Pet(s) for this Stay
                  </h2>
                  <Link href="/pets/new" className="text-xs font-bold text-emerald-600 hover:underline">
                    + Add New Pet
                  </Link>
                </div>

                {pets.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                    No registered pets found.{' '}
                    <Link href="/pets/new" className="text-emerald-700 font-bold hover:underline">
                      Add a pet profile now
                    </Link>{' '}
                    or default demo companion will be selected.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pets.map((p) => {
                      const isSelected = selectedPetIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleTogglePet(p.id)}
                          className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/50 text-slate-900'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
                            {p.species === 'DOG' ? '🐕' : '🐈'}
                          </div>
                          <div className="flex-1 text-xs">
                            <p className="font-bold text-slate-900">{p.name}</p>
                            <p className="text-slate-500">{p.breed} • {p.weightLbs} lbs</p>
                          </div>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Vet Emergency Authorization Limit */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Veterinary Emergency Authorization
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In the rare event of acute illness or injury, you authorize your host to seek emergency veterinary care
                  at your designated clinic or the nearest emergency facility up to this approved limit.
                </p>

                <div className="max-w-xs">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Emergency Spending Limit (₹ INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min={1000}
                      max={50000}
                      step={500}
                      value={vetEmergencyDollars}
                      onChange={(e) => setVetEmergencyDollars(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 pl-7 p-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Recommended: ₹5,000 - ₹10,000 for emergency clinic visits.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Care Notes & Instructions for Host
                  </label>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Charlie loves playing fetch in the evening, gets feeding at 8am and 7pm..."
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Method Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" /> Payment Method (India)
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <Lock className="h-3 w-3 text-emerald-600" /> Razorpay Secured 256-Bit SSL
                  </span>
                </div>

                {/* Payment Tabs: UPI / Card / NetBanking */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`py-2 rounded-lg transition ${paymentMethod === 'UPI' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-slate-900'}`}
                  >
                    UPI (GPay / PhonePe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-2 rounded-lg transition ${paymentMethod === 'CARD' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-slate-900'}`}
                  >
                    Card (RuPay / Visa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('NETBANKING')}
                    className={`py-2 rounded-lg transition ${paymentMethod === 'NETBANKING' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-slate-900'}`}
                  >
                    Net Banking
                  </button>
                </div>

                {paymentMethod === 'UPI' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      ⚡ Instant mandate authorization via Google Pay, PhonePe, Paytm, or BHIM UPI.
                    </p>
                  </div>
                )}

                {paymentMethod === 'CARD' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Card Number (RuPay, Visa, Mastercard)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={cardNumber}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-mono text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                          Expires
                        </label>
                        <input
                          type="text"
                          disabled
                          value={cardExpiry}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-mono text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                          CVC / CVV
                        </label>
                        <input
                          type="text"
                          disabled
                          value={cardCvc}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'NETBANKING' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Select Your Bank
                    </label>
                    <select className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500">
                      <option>HDFC Bank</option>
                      <option>State Bank of India (SBI)</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-100 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">PawStay Escrow Protection</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Your card is held for authorization. Payment is captured only when the stay starts and released to the host 24 hours after completion.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {isSubmitting ? (
                    'Processing Authorization...'
                  ) : (
                    <>
                      <Lock className="h-4 w-4" /> Authorize & Confirm ({formatCentsToDollars(quote.ownerTotalMinor)})
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Right 1 Col: Itemized Stay Summary */}
            <div>
              <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Stay Summary
                </h3>

                {sitter && (
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-700 text-white font-bold text-lg flex items-center justify-center shrink-0">
                      {sitter.name.charAt(0)}
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900 text-sm">{sitter.name}</p>
                      <p className="text-slate-500">{sitter.city}, {sitter.state}</p>
                      <span className="text-emerald-700 font-semibold">{serviceType.replace('_', ' ')}</span>
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Dates:</span>
                    <span className="font-semibold text-slate-900">{startDate} to {endDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Duration:</span>
                    <span className="font-semibold text-slate-900">{nights} night{nights > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Pets:</span>
                    <span className="font-semibold text-slate-900">{selectedPetIds.length} Pet{selectedPetIds.length > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Base rate ({formatCentsToDollars(quote.baseRateMinor)} × {quote.unitsCount} nights)</span>
                    <span className="font-semibold">{formatCentsToDollars(quote.baseAmountMinor)}</span>
                  </div>

                  {quote.additionalPetsMinor > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Additional pet surcharge</span>
                      <span className="font-semibold">{formatCentsToDollars(quote.additionalPetsMinor)}</span>
                    </div>
                  )}

                  {quote.extendedStayDiscountMinor > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Extended stay discount</span>
                      <span className="font-semibold">-{formatCentsToDollars(quote.extendedStayDiscountMinor)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      PawStay 7% safety fee
                    </span>
                    <span className="font-semibold">{formatCentsToDollars(quote.ownerServiceFeeMinor)}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-extrabold text-slate-900">
                    <span>Total All-In</span>
                    <span className="text-emerald-700">{formatCentsToDollars(quote.ownerTotalMinor)}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5 text-center text-[11px] text-slate-500">
                  Zero surprise fees. Cancellation subject to host policy.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-sm font-semibold text-slate-500">Loading checkout...</p>
        </div>
      }
    >
      <CheckoutContent />
    </React.Suspense>
  );
}
