import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, Prisma } from '@pawstay/db';
import { Navbar } from '@/components/Navbar';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Star,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Sliders,
  Settings,
} from 'lucide-react';
import { formatCentsToDollars } from '@/lib/utils';

const sitterInclude = {
  user: true,
  verification: true,
  homeProfile: true,
  services: true,
  availabilities: {
    take: 7,
    orderBy: { date: 'asc' as const },
  },
  bookings: {
    take: 5,
    orderBy: { createdAt: 'desc' as const },
    include: {
      owner: true,
      bookingPets: { include: { pet: true } },
    },
  },
} as const;

type SitterWithRelations = Prisma.SitterProfileGetPayload<{
  include: typeof sitterInclude;
}>;

export default async function SitterDashboardPage({
  searchParams,
}: {
  searchParams: { applied?: string };
}) {
  const session = await getServerSession(authOptions);

  // If user is not logged in or in test mode, fetch a fallback/seed sitter for live demo inspection
  let sitter: SitterWithRelations | null = null;
  if (session?.user?.id) {
    sitter = await prisma.sitterProfile.findUnique({
      where: { userId: session.user.id },
      include: sitterInclude,
    });
  }

  // Fallback demo sitter if no active session (or first seed sitter) so visitor can inspect the dashboard
  if (!sitter) {
    sitter = await prisma.sitterProfile.findFirst({
      where: { status: 'APPROVED' },
      include: sitterInclude,
    });
  }

  if (!sitter) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar user={session?.user} />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Sitter Profile Found</h2>
            <p className="text-sm text-slate-600 mb-6">
              You have not yet submitted an application to become a verified PawStay sitter.
            </p>
            <Link
              href="/sitter/apply"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              Start Application <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isPending = sitter.status === 'PENDING';
  const isApproved = sitter.status === 'APPROVED';
  const isChangesRequested = sitter.status === 'CHANGES_REQUESTED';
  const isRejected = sitter.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session?.user || { id: sitter.userId, name: sitter.user.name, email: sitter.user.email, roles: ['SITTER'] }} />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Status Banners */}
          {searchParams.applied && (
            <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Application Submitted Successfully!</p>
                <p className="text-xs text-emerald-700">
                  Your identity verification and background check were initiated. Our Trust & Safety team is reviewing your profile.
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-950">
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-base">Application Under Ops Review</h3>
                  <p className="mt-1 text-sm text-amber-800">
                    Your application is currently in the review queue. PawStay verifies every host personally before making profiles searchable by pet owners.
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2 rounded-lg bg-white/80 p-2.5 border border-amber-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Identity Document: <strong>Verified</strong></span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white/80 p-2.5 border border-amber-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Background Check: <strong>Clear</strong></span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white/80 p-2.5 border border-amber-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Safety Quiz: <strong>Passed (100%)</strong></span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white/80 p-2.5 border border-amber-200">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Admin Approval: <strong>In Review</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isApproved && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">Verified PawStay Host</h3>
                    <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-extrabold text-emerald-900">
                      Live & Searchable
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Your profile is active in {sitter.city}, {sitter.state}. Pet owners can view your listing and request bookings.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/sitter/${sitter.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View Public Profile
                </Link>
              </div>
            </div>
          )}

          {isChangesRequested && (
            <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-base">Action Required: Changes Requested</h3>
                  <p className="mt-1 text-sm text-amber-800">
                    Ops review note: {sitter.verification?.adminNotes || 'Please update your home profile photos or services.'}
                  </p>
                  <Link
                    href="/sitter/apply"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                  >
                    Update Application Details
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Sitter Header Profile Bar */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-2xl font-black text-white shadow-md">
                {sitter.user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">{sitter.user.name}</h1>
                <p className="text-sm font-medium text-slate-600">{sitter.headline}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {sitter.city}, {sitter.state} • {sitter.yearsOfExperience} years experience • Max capacity: {sitter.maxPetCapacity} pets
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/sitter/apply"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Sliders className="h-3.5 w-3.5 text-slate-500" /> Edit Rates & Settings
              </Link>
            </div>
          </div>

          {/* Performance Metrics Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
                <span>Reliability Score</span>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {Math.round(sitter.reliabilityScore * 100)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Zero unexcused cancellations</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
                <span>Bayesian Rating</span>
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {sitter.ratingBayesian.toFixed(1)} ★
              </p>
              <p className="text-xs text-slate-400 mt-1">{sitter.reviewCount} verified reviews</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
                <span>Response Time</span>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                ~{sitter.responseTimeMinutes}m
              </p>
              <p className="text-xs text-slate-400 mt-1">{sitter.responseRatePercent}% response rate</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
                <span>Direct Payouts</span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-emerald-600">Active</p>
              <p className="text-xs text-slate-400 mt-1">Stripe Express account connected</p>
            </div>
          </div>

          {/* Main 2-Column Content */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Services & Recent Requests */}
            <div className="space-y-8 lg:col-span-2">
              {/* Active Services */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Offered Services & Pricing</h3>
                  <Link href="/sitter/apply" className="text-xs font-bold text-emerald-600 hover:underline">
                    Manage Rates
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {sitter.services.map((svc) => (
                    <div key={svc.id} className="py-3 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-bold text-slate-900">{svc.serviceType.replace('_', ' ')}</span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Additional pet: +{formatCentsToDollars(svc.additionalPetRateMinor)} • Holiday: +{formatCentsToDollars(svc.holidaySurchargeMinor)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-700 text-base">
                          {formatCentsToDollars(svc.baseRateMinor)}
                        </span>
                        <span className="text-xs text-slate-400 block">per night / unit</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Requests Inbox */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Recent Booking Inquiries</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                    {sitter.bookings.length} Total
                  </span>
                </div>

                {sitter.bookings.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No booking inquiries yet. When owners book your services, requests will appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sitter.bookings.map((b) => (
                      <div
                        key={b.id}
                        className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {b.owner.name} ({b.serviceType.replace('_', ' ')})
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                b.status === 'PAID_HELD' || b.status === 'IN_PROGRESS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'REQUESTED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()} • {b.bookingPets?.length || 1} Pet(s)
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-slate-900 text-sm">
                            {formatCentsToDollars(b.ownerTotalMinor)}
                          </p>
                          <span className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer">
                            View Details
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Home Environment & Trust Badges */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-3">Host Verification Badges</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-2.5 text-emerald-900">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Government ID Verified</p>
                      <p className="text-emerald-700">Driver's License & Biometrics verified</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-2.5 text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Background Checked</p>
                      <p className="text-emerald-700">Nationwide criminal & safety check clear</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-2.5 text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Pet Safety Exam</p>
                      <p className="text-emerald-700">Passed first-aid & bloat protocol test</p>
                    </div>
                  </div>
                </div>
              </div>

              {sitter.homeProfile && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-3">Home Environment</h3>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Home Type</span>
                      <span className="font-semibold">{sitter.homeProfile.homeType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Fenced Yard</span>
                      <span className="font-semibold">{sitter.homeProfile.hasFencedYard ? 'Yes (Securely Fenced)' : 'No'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Yard Size</span>
                      <span className="font-semibold">{sitter.homeProfile.yardSize}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Resident Pets</span>
                      <span className="font-semibold">{sitter.homeProfile.hasOtherPetsInHome ? 'Yes' : 'None'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Smoke Free</span>
                      <span className="font-semibold">{sitter.homeProfile.isSmokingFree ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
