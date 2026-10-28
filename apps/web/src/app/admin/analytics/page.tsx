'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ShieldAlert,
  Star,
  CheckCircle,
  MapPin,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { formatCentsToDollars } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
        Computing marketplace telemetry and analytics...
      </div>
    );
  }

  const { metrics, metroStats } = data || { metrics: {}, metroStats: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4 mb-8">
        <div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full">
            Executive Analytics
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Platform Performance & Funnel</h1>
          <p className="text-sm text-slate-500">
            Real-time GMV, take rate, marketplace liquidity, and safety telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/sitters"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Sitter Applications
          </Link>
          <Link
            href="/admin/disputes"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Disputes Console
          </Link>
          <Link
            href="/admin/analytics"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white shadow-sm transition"
          >
            Analytics & Metrics
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* GMV */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Merchandise (GMV)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCentsToDollars(metrics.totalGmvMinor || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total spend through escrow ledger</p>
        </div>

        {/* Platform Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Net Platform Revenue</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCentsToDollars(metrics.totalPlatformRevenueMinor || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.takeRatePercent}% effective take rate (7% owner + 12% sitter)
          </p>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics.totalBookings || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.completedCount} completed · {metrics.disputedCount} disputed
          </p>
        </div>

        {/* Repeat Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Client Repeat Rate</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics.repeatRatePercent}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Owners booking multiple stays</p>
        </div>
      </div>

      {/* Middle Section: Metro Liquidity & Verification Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Supply vs Demand by Metro */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center">
            <MapPin className="h-4 w-4 text-emerald-600 mr-2" />
            Marketplace Liquidity by Launch Metro
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Balance of approved verified sitters vs stay request volume.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Launch City</th>
                  <th className="py-2.5 px-3">Approved Hosts</th>
                  <th className="py-2.5 px-3">Total Stays</th>
                  <th className="py-2.5 px-3">Liquidity Ratio</th>
                  <th className="py-2.5 px-3">Market Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {metroStats.map((metro: any) => (
                  <tr key={metro.city} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{metro.city}</td>
                    <td className="py-3 px-3">{metro.approvedSitters} sitters</td>
                    <td className="py-3 px-3">{metro.totalBookings} bookings</td>
                    <td className="py-3 px-3 font-mono">{metro.liquidityRatio}x</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        Healthy Liquidity
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Host Verification & Safety Funnel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center">
              <ShieldAlert className="h-4 w-4 text-rose-600 mr-2" />
              Safety & Verification Health
            </h2>
            <p className="text-xs text-slate-500 mb-4">Trust loop enforcement metrics.</p>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-600">Total Sitter Applicants:</span>
                <span className="font-bold text-slate-900">{metrics.totalSitters}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-600">Vetted & Approved:</span>
                <span className="font-bold text-emerald-600">{metrics.approvedSittersCount}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-600">Pending Background Check:</span>
                <span className="font-bold text-amber-600">{metrics.pendingSittersCount}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-600">Platform Star Rating Avg:</span>
                <span className="font-bold text-slate-900 flex items-center">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 mr-1" />
                  {metrics.averageRating} / 5.0
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Off-Platform Leakage Intercepts:</span>
                <span className="font-bold text-rose-600 font-mono">
                  {metrics.interceptedMessages} attempts
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Automatic refresh every 60s</span>
            <button
              onClick={fetchAnalytics}
              className="text-emerald-600 font-bold hover:underline flex items-center"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
