'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Filter,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { formatCentsToDollars } from '@/lib/utils';

interface DisputeItem {
  id: string;
  bookingId: string;
  reason: string;
  description: string;
  evidenceUrls: string[];
  requestedRefundMinor: number | null;
  status: string;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  initiator: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  booking: {
    id: string;
    bookingNumber: string;
    serviceType: string;
    status: string;
    ownerTotalMinor: number;
    sitterNetPayoutMinor: number;
    owner: { name: string; email: string };
    sitter: { user: { name: string; email: string } };
    bookingPets: Array<{ pet: { name: string; species: string } }>;
  };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/disputes');
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
      }
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (
    disputeId: string,
    action: 'RESOLVE_REFUND_OWNER' | 'RESOLVE_RELEASE_SITTER' | 'DISMISS'
  ) => {
    if (!confirm(`Are you sure you want to execute resolution action: ${action}?`)) {
      return;
    }

    setActionLoadingId(disputeId);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: resolutionNote.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSelectedDispute(null);
        setResolutionNote('');
        await fetchDisputes();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to resolve dispute');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while resolving dispute');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'OPEN') return d.status === 'OPENED' || d.status === 'UNDER_INVESTIGATION';
    if (filterStatus === 'RESOLVED') return d.status.startsWith('RESOLVED') || d.status === 'DISMISSED';
    return d.status === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-rose-100 text-rose-800 text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              Trust & Safety Ops
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Disputes & Claims Console</h1>
          <p className="text-sm text-slate-500">
            Adjudicate stay incidents, issue escrow refunds, and enforce the PawStay Guarantee.
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center space-x-2">
          <Link
            href="/admin/sitters"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Sitter Applications
          </Link>
          <Link
            href="/admin/disputes"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white shadow-sm transition"
          >
            Disputes Console
          </Link>
          <Link
            href="/admin/analytics"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Analytics & Metrics
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          {['ALL', 'OPEN', 'RESOLVED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                filterStatus === status
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={fetchDisputes}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
          Loading dispute cases...
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No disputes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            All stays are running normally. Any claims initiated under the PawStay Guarantee will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Dispute ID / Booking</th>
                  <th className="py-3 px-4">Initiator</th>
                  <th className="py-3 px-4">Reason & Details</th>
                  <th className="py-3 px-4">Financials</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDisputes.map((dispute) => {
                  const isOpen = dispute.status === 'OPENED' || dispute.status === 'UNDER_INVESTIGATION';
                  return (
                    <tr key={dispute.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        <div>{dispute.id.slice(0, 8)}...</div>
                        <Link
                          href={`/bookings/${dispute.bookingId}`}
                          className="text-[11px] text-emerald-600 hover:underline font-bold inline-flex items-center"
                        >
                          #{dispute.booking.bookingNumber} <ExternalLink className="h-3 w-3 ml-0.5" />
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{dispute.initiator.name}</div>
                        <div className="text-[11px] text-slate-400">{dispute.initiator.email}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-bold text-slate-900 block truncate">{dispute.reason}</span>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{dispute.description}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {formatCentsToDollars(dispute.booking.ownerTotalMinor)} stay total
                        </div>
                        {dispute.requestedRefundMinor && (
                          <div className="text-[11px] text-rose-600 font-semibold">
                            Req. Refund: {formatCentsToDollars(dispute.requestedRefundMinor)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            isOpen
                              ? 'bg-amber-100 text-amber-800'
                              : dispute.status === 'RESOLVED_REFUND'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {dispute.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isOpen ? (
                          <button
                            onClick={() => setSelectedDispute(dispute)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition"
                          >
                            Adjudicate
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjudication Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <ShieldAlert className="h-5 w-5 text-rose-600 mr-2" />
                Adjudicate Dispute #{selectedDispute.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p><span className="font-bold text-slate-700">Booking:</span> #{selectedDispute.booking.bookingNumber}</p>
                <p><span className="font-bold text-slate-700">Owner:</span> {selectedDispute.booking.owner.name} ({selectedDispute.booking.owner.email})</p>
                <p><span className="font-bold text-slate-700">Sitter:</span> {selectedDispute.booking.sitter.user.name}</p>
                <p><span className="font-bold text-slate-700">Stay Value:</span> {formatCentsToDollars(selectedDispute.booking.ownerTotalMinor)}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Claim Details:</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                  {selectedDispute.description}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Resolution Notes / Findings:
                </label>
                <textarea
                  rows={2}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Reasoning recorded in immutable audit log and notified to parties..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Resolution Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleResolve(selectedDispute.id, 'RESOLVE_REFUND_OWNER')}
                disabled={actionLoadingId === selectedDispute.id}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition"
              >
                Issue Full Refund to Owner
              </button>

              <button
                onClick={() => handleResolve(selectedDispute.id, 'RESOLVE_RELEASE_SITTER')}
                disabled={actionLoadingId === selectedDispute.id}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition"
              >
                Release Payout to Sitter
              </button>

              <button
                onClick={() => handleResolve(selectedDispute.id, 'DISMISS')}
                disabled={actionLoadingId === selectedDispute.id}
                className="py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Dismiss Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
