'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  FileText,
  Search,
  Filter,
  ArrowRight,
  User,
  Home,
  Check,
  X,
} from 'lucide-react';
import { formatCentsToDollars } from '@/lib/utils';

interface SitterItem {
  id: string;
  userId: string;
  headline: string;
  bio: string;
  city: string;
  state: string;
  postalCode: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  yearsOfExperience: number;
  maxPetCapacity: number;
  safetyQuizPassed: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  verification?: {
    id: string;
    status: string;
    idDocumentType?: string | null;
    idDocumentFrontUrl?: string | null;
    selfieUrl?: string | null;
    identityCheckStatus: string;
    backgroundCheckStatus: string;
    backgroundCheckRef?: string | null;
    adminNotes?: string | null;
  } | null;
  homeProfile?: {
    homeType: string;
    hasFencedYard: boolean;
    yardSize: string;
    hasOtherPetsInHome: boolean;
    hasChildrenInHome: boolean;
    isSmokingFree: boolean;
  } | null;
  services: {
    id: string;
    serviceType: string;
    baseRateMinor: number;
  }[];
}

export default function AdminSittersPage() {
  const [sitters, setSitters] = useState<SitterItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    PENDING: 0,
    APPROVED: 0,
    CHANGES_REQUESTED: 0,
    REJECTED: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeModalSitter, setActiveModalSitter] = useState<SitterItem | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchSitters = async (status: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/sitters?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setSitters(data.sitters || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to load sitters', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSitters(selectedStatus);
  }, [selectedStatus]);

  const handleReviewAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
    if (!activeModalSitter) return;
    setIsProcessingAction(true);
    setActionSuccessMessage(null);

    try {
      const res = await fetch(`/api/admin/sitters/${activeModalSitter.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNotes }),
      });

      if (res.ok) {
        setActionSuccessMessage(`Sitter application ${action.toLowerCase()}d successfully.`);
        // Refresh list
        await fetchSitters(selectedStatus);
        setTimeout(() => {
          setActiveModalSitter(null);
          setActionSuccessMessage(null);
          setAdminNotes('');
        }, 1200);
      }
    } catch (err) {
      console.error('Error reviewing sitter:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={{ id: 'admin-ops', name: 'Ops Admin', email: 'ops@pawstay.local', roles: ['ADMIN', 'OWNER'] }} />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Trust & Safety Ops Console
              </div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Sitter Verification Queue
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Review applicant documents, background check reports, pet safety exam results, and approve hosts for the marketplace.
              </p>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="mb-6 flex border-b border-slate-200">
            {[
              { id: 'PENDING', label: 'Pending Review', count: counts.PENDING },
              { id: 'APPROVED', label: 'Approved Hosts', count: counts.APPROVED },
              { id: 'CHANGES_REQUESTED', label: 'Changes Requested', count: counts.CHANGES_REQUESTED },
              { id: 'REJECTED', label: 'Rejected', count: counts.REJECTED },
              { id: 'ALL', label: 'All Records', count: Object.values(counts).reduce((a, b) => a + b, 0) },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
                  selectedStatus === tab.id
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    selectedStatus === tab.id
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* List Content */}
          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading sitter verification applications...
            </div>
          ) : sitters.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-3 text-base font-bold text-slate-900">Queue is Clear!</h3>
              <p className="mt-1 text-sm text-slate-500">
                There are no sitter applications currently in {selectedStatus.toLowerCase()} status.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sitters.map((sitter) => {
                const idStatus = sitter.verification?.identityCheckStatus || 'PENDING';
                const bgStatus = sitter.verification?.backgroundCheckStatus || 'PENDING';
                const isPassedExam = sitter.safetyQuizPassed;

                return (
                  <div
                    key={sitter.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Applicant Overview */}
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-black text-white shrink-0">
                          {sitter.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{sitter.user.name}</h3>
                            <span className="text-xs text-slate-500">({sitter.user.email})</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                sitter.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sitter.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : sitter.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {sitter.status}
                            </span>
                          </div>

                          <p className="text-xs font-medium text-slate-700 mt-1">{sitter.headline}</p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                            <span>📍 {sitter.city}, {sitter.state}</span>
                            <span>• {sitter.yearsOfExperience} yrs exp</span>
                            <span>• Max {sitter.maxPetCapacity} pets</span>
                            <span>• Applied: {new Date(sitter.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Verification Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            idStatus === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {idStatus === 'VERIFIED' ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          ID: {idStatus}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            bgStatus === 'CLEAR'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {bgStatus === 'CLEAR' ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                          Background: {bgStatus}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            isPassedExam
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isPassedExam ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          Safety Quiz: {isPassedExam ? 'Passed' : 'Pending'}
                        </span>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModalSitter(sitter);
                            setAdminNotes(sitter.verification?.adminNotes || '');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> Review Application
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal / Inspection Drawer */}
          {activeModalSitter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Sitter Application: {activeModalSitter.user.name}
                    </h3>
                    <p className="text-xs text-slate-500">{activeModalSitter.user.email} • {activeModalSitter.city}, {activeModalSitter.state}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModalSitter(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {actionSuccessMessage && (
                  <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
                    {actionSuccessMessage}
                  </div>
                )}

                <div className="mt-4 space-y-4 text-xs">
                  {/* Bio & Headline */}
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                    <p className="font-bold text-slate-900 text-sm">{activeModalSitter.headline}</p>
                    <p className="text-slate-600 mt-1 leading-relaxed">{activeModalSitter.bio}</p>
                  </div>

                  {/* Verification Check Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="font-bold text-slate-800 mb-1">Identity Verification</p>
                      <p className="text-slate-600">Doc Type: {activeModalSitter.verification?.idDocumentType || "Driver's License"}</p>
                      <p className="text-emerald-700 font-bold mt-1">Status: {activeModalSitter.verification?.identityCheckStatus || 'VERIFIED'}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="font-bold text-slate-800 mb-1">Background Check</p>
                      <p className="text-slate-600">Ref: {activeModalSitter.verification?.backgroundCheckRef || 'chk_mock_clean_registry'}</p>
                      <p className="text-emerald-700 font-bold mt-1">Status: {activeModalSitter.verification?.backgroundCheckStatus || 'CLEAR'}</p>
                    </div>
                  </div>

                  {/* Home Profile */}
                  {activeModalSitter.homeProfile && (
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="font-bold text-slate-800 mb-1">Home Environment</p>
                      <div className="grid grid-cols-3 gap-2 text-slate-600">
                        <span>Type: {activeModalSitter.homeProfile.homeType}</span>
                        <span>Fenced Yard: {activeModalSitter.homeProfile.hasFencedYard ? 'Yes' : 'No'}</span>
                        <span>Resident Pets: {activeModalSitter.homeProfile.hasOtherPetsInHome ? 'Yes' : 'None'}</span>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Ops Review Notes (Audited)
                    </label>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Enter internal review notes or instructions for the applicant..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => handleReviewAction('REQUEST_CHANGES')}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                  >
                    Request Changes
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => handleReviewAction('REJECT')}
                    className="rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => handleReviewAction('APPROVE')}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                  >
                    Approve Sitter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
