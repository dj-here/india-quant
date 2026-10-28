import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import { Navbar } from '@/components/Navbar';
import {
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Heart,
  DollarSign,
  Phone,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { formatCentsToDollars } from '@/lib/utils';
import { canViewSitterExactAddress, calculateCancellationRefund } from '@pawstay/shared';

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { confirmed?: string };
}) {
  const session = await getServerSession(authOptions);

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      sitter: { include: { user: true } },
      bookingPets: { include: { pet: true } },
      charges: true,
      payouts: true,
      ledgerEntries: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!booking) {
    notFound();
  }

  const currentUser = session?.user || { id: booking.ownerId, roles: ['OWNER'] };
  const isOwner = currentUser.id === booking.ownerId;
  const isSitter = currentUser.id === booking.sitter.userId;

  // Address Privacy enforcement
  const showExactAddress = canViewSitterExactAddress(
    currentUser as any,
    booking.sitter as any,
    {
      id: booking.id,
      ownerId: booking.ownerId,
      sitterId: booking.sitterId,
      status: booking.status as any,
      sitterUserId: booking.sitter.userId,
    }
  );

  const cancellationRefundCalc = calculateCancellationRefund({
    policy: booking.cancellationPolicy,
    cancelledBy: 'OWNER',
    bookingStartDate: booking.startDate,
    subtotalMinor: booking.subtotalMinor,
    ownerServiceFeeMinor: booking.ownerServiceFeeMinor,
    ownerTotalPaidMinor: booking.ownerTotalMinor,
  });

  const LIFECYCLE_STEPS = [
    { key: 'REQUESTED', label: 'Requested' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'PAID_HELD', label: 'Payment Held' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'PAYOUT_RELEASED', label: 'Payout Released' },
  ];

  const currentStepIdx = LIFECYCLE_STEPS.findIndex((s) => s.key === booking.status);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session?.user} />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Confirmation Alert */}
          {searchParams.confirmed && (
            <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Booking Successfully Created!</p>
                <p className="text-xs text-emerald-800">
                  {booking.status === 'PAID_HELD'
                    ? 'Payment hold authorized. Your stay is confirmed and funds are safely held in escrow.'
                    : 'Your request has been sent to the host. They have 24 hours to accept.'}
                </p>
              </div>
            </div>
          )}

          {/* Booking Header Banner */}
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-900">{booking.bookingNumber}</h1>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      booking.status === 'PAID_HELD' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-900'
                        : booking.status === 'REQUESTED' || booking.status === 'ACCEPTED'
                        ? 'bg-amber-100 text-amber-900'
                        : booking.status.startsWith('CANCELLED') || booking.status === 'REFUNDED'
                        ? 'bg-rose-100 text-rose-900'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {booking.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {booking.serviceType.replace('_', ' ')} stay from {new Date(booking.startDate).toLocaleDateString()} to{' '}
                  {new Date(booking.endDate).toLocaleDateString()} ({booking.unitsCount} nights)
                </p>
              </div>

              {/* Emergency Action */}
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100"
              >
                <AlertTriangle className="h-4 w-4 text-rose-600" /> 24/7 Safety & Vet Emergency
              </button>
            </div>

            {/* Lifecycle Progress Bar */}
            {!booking.status.startsWith('CANCELLED') && booking.status !== 'DECLINED' && booking.status !== 'EXPIRED' && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="grid grid-cols-6 gap-1 text-center">
                  {LIFECYCLE_STEPS.map((s, idx) => {
                    const isDone = currentStepIdx >= idx;
                    const isCurrent = booking.status === s.key;
                    return (
                      <div key={s.key} className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold mb-1 transition ${
                            isDone ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                          } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[11px] hidden sm:inline ${isDone ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Sitter/Owner Details & State Transitions */}
            <div className="space-y-6 lg:col-span-2">
              {/* Host & Location Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">Host Family Information</h3>
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-700 text-white font-bold text-xl flex items-center justify-center shrink-0">
                    {booking.sitter.user.name.charAt(0)}
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-base font-bold text-slate-900">{booking.sitter.user.name}</p>
                    <p className="text-slate-500">{booking.sitter.headline}</p>

                    <div className="pt-2 text-slate-700">
                      {showExactAddress ? (
                        <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-emerald-950">
                          <p className="font-bold flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-emerald-600" /> Confirmed Stay Address:
                          </p>
                          <p className="mt-1 font-medium">
                            {booking.sitter.addressLine1}, {booking.sitter.city}, {booking.sitter.state} {booking.sitter.postalCode}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-slate-600">
                          <p className="font-bold flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-slate-400" /> Approximate Neighborhood:
                          </p>
                          <p className="mt-1">
                            Central {booking.sitter.city}, {booking.sitter.state} {booking.sitter.postalCode}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Exact house address is revealed after booking payment is held to protect host privacy.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Pets */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">Guest Pets ({booking.bookingPets.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {booking.bookingPets.map((bp) => (
                    <div key={bp.id} className="rounded-xl border border-slate-200 p-3.5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
                        {bp.pet.species === 'DOG' ? '🐕' : '🐈'}
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">{bp.pet.name}</p>
                        <p className="text-slate-500">{bp.pet.breed} • {bp.pet.weightLbs} lbs</p>
                        <p className="text-emerald-700 text-[11px] font-semibold mt-0.5">Feeding: {bp.pet.feedingSchedule}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Actions & Transition Buttons */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-3">Booking Actions</h3>

                {booking.status === 'REQUESTED' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      The booking is waiting for host review. Sitter or owner can take action:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <form action={`/api/bookings/${booking.id}/transition`} method="POST">
                        <input type="hidden" name="targetStatus" value="ACCEPTED" />
                        <button
                          type="submit"
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                        >
                          Accept Booking (Sitter)
                        </button>
                      </form>

                      <form action={`/api/bookings/${booking.id}/transition`} method="POST">
                        <input type="hidden" name="targetStatus" value="DECLINED" />
                        <button
                          type="submit"
                          className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Decline Request
                        </button>
                      </form>

                      <form action={`/api/bookings/${booking.id}/transition`} method="POST">
                        <input type="hidden" name="targetStatus" value="CANCELLED_BY_OWNER" />
                        <button
                          type="submit"
                          className="rounded-xl border border-rose-300 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                        >
                          Cancel Request (Owner)
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {booking.status === 'ACCEPTED' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      The host accepted your booking! Authorize payment hold to confirm your stay:
                    </p>
                    <form action={`/api/bookings/${booking.id}/transition`} method="POST">
                      <input type="hidden" name="targetStatus" value="PAID_HELD" />
                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                      >
                        Authorize & Hold Funds ({formatCentsToDollars(booking.ownerTotalMinor)})
                      </button>
                    </form>
                  </div>
                )}

                {booking.status === 'PAID_HELD' && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-200">
                      Funds are held in escrow. When the pet arrives, check-in to begin the stay.
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <form action={`/api/bookings/${booking.id}/transition`} method="POST">
                        <input type="hidden" name="targetStatus" value="IN_PROGRESS" />
                        <button
                          type="submit"
                          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
                        >
                          Check-In & Start Stay
                        </button>
                      </form>

                      <Link
                        href={`/bookings/${booking.id}/updates`}
                        className="rounded-xl border border-emerald-600 text-emerald-700 bg-emerald-50 px-4 py-2.5 text-xs font-bold hover:bg-emerald-100 flex items-center"
                      >
                        Daily Updates Feed
                      </Link>

                      <form action={`/api/bookings/${booking.id}/transition`} method="POST">
                        <input type="hidden" name="targetStatus" value="CANCELLED_BY_OWNER" />
                        <button
                          type="submit"
                          className="rounded-xl border border-rose-300 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                        >
                          Cancel Stay (Refund: {formatCentsToDollars(cancellationRefundCalc.refundAmountMinor)})
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {booking.status === 'IN_PROGRESS' && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-900 border border-blue-200">
                      Stay is actively in progress! Sitter can post daily photo/video updates or complete checkout.
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/bookings/${booking.id}/updates`}
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 flex items-center"
                      >
                        📸 Post / View Daily Updates
                      </Link>

                      <form action={`/api/bookings/${booking.id}/transition`} method="POST">
                        <input type="hidden" name="targetStatus" value="COMPLETED" />
                        <button
                          type="submit"
                          className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Mark Stay Completed (Checkout)
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {booking.status === 'COMPLETED' && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-200">
                      Stay completed! Sitter payout scheduled for automatic release in 24 hours.
                    </div>
                    <div className="flex gap-2">
                      <form action={`/api/bookings/${booking.id}/transition`} method="POST">
                        <input type="hidden" name="targetStatus" value="PAYOUT_RELEASED" />
                        <button
                          type="submit"
                          className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                        >
                          Release Sitter Payout Now
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {booking.status === 'PAYOUT_RELEASED' && (
                  <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-200 font-bold">
                    ✓ Payout of {formatCentsToDollars(booking.sitterNetPayoutMinor)} released to sitter Stripe Connect account.
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Financial Breakdown & Double-Entry Ledger Inspection */}
            <div className="space-y-6">
              {/* Itemized Price Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-xs">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Financial Breakdown
                </h3>

                <div className="flex justify-between text-slate-600">
                  <span>Nightly Base ({formatCentsToDollars(booking.unitPriceMinor)} × {booking.unitsCount})</span>
                  <span className="font-semibold">{formatCentsToDollars(booking.unitPriceMinor * booking.unitsCount)}</span>
                </div>

                {booking.additionalPetsSurchargeMinor > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Additional Pets Surcharge</span>
                    <span className="font-semibold">{formatCentsToDollars(booking.additionalPetsSurchargeMinor)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Stay Subtotal</span>
                  <span className="font-bold text-slate-900">{formatCentsToDollars(booking.subtotalMinor)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Owner Service Fee (7%)</span>
                  <span className="font-semibold">{formatCentsToDollars(booking.ownerServiceFeeMinor)}</span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Paid (Owner)</span>
                  <span className="text-emerald-700">{formatCentsToDollars(booking.ownerTotalMinor)}</span>
                </div>

                <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Sitter Commission (12%):</span>
                    <span>-{formatCentsToDollars(booking.sitterCommissionMinor)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Sitter Net Payout:</span>
                    <span>{formatCentsToDollars(booking.sitterNetPayoutMinor)}</span>
                  </div>
                </div>
              </div>

              {/* Double-Entry Ledger Log */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Double-Entry Ledger Audit</h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Reconciled ledger entries for this booking:
                </p>

                {booking.ledgerEntries.length === 0 ? (
                  <p className="text-xs text-slate-400">No ledger entries recorded yet.</p>
                ) : (
                  <div className="space-y-2 text-[11px]">
                    {booking.ledgerEntries.map((le) => (
                      <div key={le.id} className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{le.entryType}</span>
                          <span>{formatCentsToDollars(le.amountMinor)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[10px] mt-0.5">
                          <span>Debit: {le.debitAccount}</span>
                          <span>Credit: {le.creditAccount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
