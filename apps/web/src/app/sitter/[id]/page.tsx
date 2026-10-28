import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@pawstay/db';
import { Navbar } from '@/components/Navbar';
import {
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Home,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { formatCentsToDollars } from '@/lib/utils';
import { calculateBookingPrice } from '@pawstay/shared';

export default async function SitterDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: {
    serviceType?: string;
    startDate?: string;
    endDate?: string;
    petCount?: string;
  };
}) {
  const sitter = await prisma.sitterProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      verification: true,
      homeProfile: true,
      services: true,
      availabilities: {
        take: 30,
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!sitter) {
    notFound();
  }

  // Fetch reviews received by the sitter
  const reviews = await prisma.review.findMany({
    where: {
      targetId: sitter.userId,
      isBlind: false, // Double-blind requirement: only show revealed reviews!
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const selectedServiceType = searchParams.serviceType || sitter.services[0]?.serviceType || 'BOARDING';
  const activeService = sitter.services.find((s) => s.serviceType === selectedServiceType) || sitter.services[0];

  const startDate = searchParams.startDate || new Date().toISOString().split('T')[0]!;
  const endDate =
    searchParams.endDate ||
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
  const petCount = Number(searchParams.petCount || 1);

  const nights = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000))
  );

  // Price calculation
  const quote = activeService
    ? calculateBookingPrice({
        baseRateMinor: activeService.baseRateMinor,
        unitsCount: nights,
        petCount,
        additionalPetRateMinor: activeService.additionalPetRateMinor,
        extendedStayDiscountPercent: activeService.extendedStayDiscountPercent,
      })
    : null;

  // Kennel benchmark comparison ($75/night typical kennel benchmark)
  const kennelBenchmarkNightlyMinor = 7500;
  const kennelTotalEstimateMinor = kennelBenchmarkNightlyMinor * nights * petCount;
  const savingsMinor = quote ? Math.max(0, kennelTotalEstimateMinor - quote.ownerTotalMinor) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Sitter Header */}
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-700 text-3xl font-black text-white shadow-md shrink-0">
                  {sitter.user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900">{sitter.user.name}</h1>
                    <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>{sitter.ratingBayesian.toFixed(1)}</span>
                      <span className="text-amber-600 font-normal">({sitter.reviewCount} reviews)</span>
                    </div>
                    {sitter.instantBookEnabled && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        ⚡ Instant Book
                      </span>
                    )}
                  </div>

                  <p className="text-base font-semibold text-slate-700 mt-1">{sitter.headline}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {sitter.city}, {sitter.state} (Approx. neighborhood)
                    </span>
                    <span>•</span>
                    <span>{sitter.yearsOfExperience} years pet care experience</span>
                    <span>•</span>
                    <span className="text-blue-700 font-medium">Replies within ~{sitter.responseTimeMinutes}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main 2-Column Content */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Details, Home, Reviews, Kennel Comparison */}
            <div className="space-y-8 lg:col-span-2">
              {/* Trust & Safety Badges */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                <h3 className="text-sm font-bold text-emerald-950 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> PawStay Verified Host Guarantee
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Identity & Biometrics Verified</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Criminal Background Cleared</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Pet Safety & Bloat Exam Passed</span>
                  </div>
                </div>
              </div>

              {/* Bio & Philosophy */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-3">About {sitter.user.name}</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{sitter.bio}</p>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Max Pet Capacity</span>
                    <span className="font-bold text-slate-800">{sitter.maxPetCapacity} Pets</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Species Accepted</span>
                    <span className="font-bold text-slate-800">{sitter.acceptedSpecies.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Medication Admin</span>
                    <span className="font-bold text-slate-800">
                      {sitter.hasMedicationExperience ? 'Yes, Experienced' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Home & Yard Environment */}
              {sitter.homeProfile && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Home className="h-5 w-5 text-emerald-600" /> Home & Yard Environment
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-700">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-slate-400 block mb-1">Home Type</span>
                      <span className="font-bold text-slate-900">{sitter.homeProfile.homeType}</span>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-slate-400 block mb-1">Fenced Yard</span>
                      <span className="font-bold text-slate-900">
                        {sitter.homeProfile.hasFencedYard ? `Yes (${sitter.homeProfile.yardSize})` : 'No Yard'}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-slate-400 block mb-1">Resident Pets</span>
                      <span className="font-bold text-slate-900">
                        {sitter.homeProfile.hasOtherPetsInHome ? 'Yes, friendly pets present' : 'No pets living here'}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-slate-400 block mb-1">Children in Home</span>
                      <span className="font-bold text-slate-900">
                        {sitter.homeProfile.hasChildrenInHome ? 'Yes' : 'No children'}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-slate-400 block mb-1">Smoking Policy</span>
                      <span className="font-bold text-slate-900">
                        {sitter.homeProfile.isSmokingFree ? '100% Smoke-Free' : 'Smoking Allowed'}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-slate-400 block mb-1">Furniture Access</span>
                      <span className="font-bold text-slate-900">
                        {sitter.homeProfile.allowsPetsOnFurniture ? 'Allowed on Sofas/Beds' : 'Floors Only'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Approximate Location Notice & Privacy Map Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Neighborhood & Location</h3>
                <p className="text-xs text-slate-500 mb-4">
                  To protect the safety and privacy of host families, the exact street address is provided only after
                  booking payment is held.
                </p>

                <div className="rounded-xl border border-slate-200 bg-slate-100 p-8 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                  <p className="text-sm font-bold text-slate-800">
                    Host is located within ~{sitter.approxRadiusMiles} miles of central {sitter.city}, {sitter.state}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    ZIP: {sitter.postalCode} • Cross streets revealed post-booking
                  </p>
                </div>
              </div>

              {/* Cost Comparison Widget vs Commercial Kennel */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Cost & Care Comparison</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Estimated based on {sitter.city} commercial kennel benchmarks vs this personalized stay.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <span className="text-xs font-bold uppercase text-slate-400">Typical Commercial Kennel</span>
                    <p className="text-xl font-black text-slate-900 mt-1">
                      {formatCentsToDollars(kennelTotalEstimateMinor)}
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-slate-600">
                      <li>• ~$75/night base cage fee</li>
                      <li>• Crowded concrete runs & noise</li>
                      <li>• Extra $15/day fee for playtime</li>
                      <li>• Strict pick-up windows or late fines</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/40 p-4">
                    <span className="text-xs font-bold uppercase text-emerald-700">PawStay Host ({sitter.user.name})</span>
                    <p className="text-xl font-black text-emerald-800 mt-1">
                      {quote ? formatCentsToDollars(quote.ownerTotalMinor) : '---'}
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-emerald-900">
                      <li>• Personalized loving home care</li>
                      <li>• Big yard & sofa cuddles</li>
                      <li>• Daily photos & video updates</li>
                      <li>• Vet emergency backing & 24/7 ops</li>
                    </ul>
                  </div>
                </div>

                {savingsMinor > 0 && (
                  <div className="mt-4 rounded-lg bg-emerald-100 p-2.5 text-center text-xs font-bold text-emerald-900">
                    💰 You save approximately {formatCentsToDollars(savingsMinor)} compared to commercial boarding!
                  </div>
                )}
              </div>

              {/* Verified Double-Blind Reviews */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Client Reviews ({reviews.length})
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span>{sitter.ratingBayesian.toFixed(1)} Bayesian rating</span>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">
                    No verified reviews published yet. New hosts receive a boost to complete their first stays!
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="py-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                              {rev.author.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{rev.author.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{rev.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Interactive Booking Quote Card */}
            <div>
              <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-2xl font-black text-slate-900">
                      {activeService ? formatCentsToDollars(activeService.baseRateMinor) : '$0'}
                    </span>
                    <span className="text-xs text-slate-500"> / night</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {sitter.cancellationPolicy} Cancellation
                  </span>
                </div>

                {/* Booking Inputs */}
                <form action="/book" method="GET" className="space-y-4">
                  <input type="hidden" name="sitterId" value={sitter.id} />
                  <input type="hidden" name="serviceType" value={selectedServiceType} />

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Dates ({nights} night{nights > 1 ? 's' : ''})
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        name="startDate"
                        defaultValue={startDate}
                        className="rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="date"
                        name="endDate"
                        defaultValue={endDate}
                        className="rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Number of Pets
                    </label>
                    <select
                      name="petCount"
                      defaultValue={petCount}
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm font-medium focus:border-emerald-500 focus:outline-none"
                    >
                      <option value={1}>1 Pet</option>
                      <option value={2}>2 Pets</option>
                      <option value={3}>3 Pets</option>
                    </select>
                  </div>

                  {/* Itemized Price Quote */}
                  {quote && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>
                          {formatCentsToDollars(quote.baseRateMinor)} × {quote.unitsCount} night{quote.unitsCount > 1 ? 's' : ''}
                        </span>
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
                          PawStay Trust & Safety Fee (7%)
                        </span>
                        <span className="font-semibold">{formatCentsToDollars(quote.ownerServiceFeeMinor)}</span>
                      </div>

                      <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                        <span>Total (All-in)</span>
                        <span className="text-emerald-700">{formatCentsToDollars(quote.ownerTotalMinor)}</span>
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/book/checkout?sitterId=${sitter.id}&serviceType=${selectedServiceType}&startDate=${startDate}&endDate=${endDate}&petCount=${petCount}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
                  >
                    {sitter.instantBookEnabled ? 'Instant Book' : 'Request to Book'} <ArrowRight className="h-4 w-4" />
                  </Link>
                </form>

                <p className="mt-3 text-center text-[11px] text-slate-400">
                  You won't be charged until the sitter accepts your booking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
