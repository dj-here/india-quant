'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Save,
  CheckCircle2,
  DollarSign,
  MapPin,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { formatCentsToDollars } from '@/lib/utils';

interface SettingItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savedSuccessKey, setSavedSuccessKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || []);
        const initialMap: Record<string, string> = {};
        for (const s of data.settings || []) {
          initialMap[s.key] = s.value;
        }
        setFormValues(initialMap);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value: formValues[key],
        }),
      });

      if (res.ok) {
        setSavedSuccessKey(key);
        setTimeout(() => setSavedSuccessKey(null), 3000);
      } else {
        alert('Failed to update setting');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating setting');
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
        Loading platform parameters...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header and Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4 mb-8">
        <div>
          <span className="bg-slate-100 text-slate-800 text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full">
            Operations Config
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Platform Settings & Benchmarks</h1>
          <p className="text-sm text-slate-500">
            Configure marketplace take rates, kennel price benchmarks, and policies.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/sitters"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Sitters
          </Link>
          <Link
            href="/admin/disputes"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Disputes
          </Link>
          <Link
            href="/admin/analytics"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Analytics
          </Link>
          <Link
            href="/admin/settings"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white shadow-sm transition"
          >
            Settings
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Marketplace Fees */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center">
            <DollarSign className="h-4 w-4 text-emerald-600 mr-2" />
            Marketplace Take Rate & Fees
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Configured in integer basis points (bps). 100 bps = 1.0%. Stored in minor units.
          </p>

          <div className="space-y-4">
            {['OWNER_SERVICE_FEE_BPS', 'SITTER_COMMISSION_BPS'].map((key) => {
              const setting = settings.find((s) => s.key === key);
              const isSaving = savingKey === key;
              const isSaved = savedSuccessKey === key;
              return (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="max-w-md">
                    <span className="font-bold text-xs text-slate-900 block font-mono">{key}</span>
                    <span className="text-[11px] text-slate-500">{setting?.description}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formValues[key] || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="w-24 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleSave(key)}
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition"
                    >
                      {isSaved ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kennel Comparison Price Benchmarks per Metro */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center">
            <MapPin className="h-4 w-4 text-emerald-600 mr-2" />
            Typical Kennel Cost Comparison Benchmarks
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Displayed on public profile and checkout comparison widgets as estimated kennel boarding rates (minor cents).
          </p>

          <div className="space-y-3">
            {[
              'KENNEL_BENCHMARK_BENGALURU',
              'KENNEL_BENCHMARK_MUMBAI',
              'KENNEL_BENCHMARK_DELHI_NCR',
              'KENNEL_BENCHMARK_PUNE',
              'KENNEL_BENCHMARK_HYDERABAD',
              'KENNEL_BENCHMARK_AUSTIN',
              'KENNEL_BENCHMARK_SEATTLE',
            ].map((key) => {
              const setting = settings.find((s) => s.key === key);
              const isSaving = savingKey === key;
              const isSaved = savedSuccessKey === key;
              const cents = Number(formValues[key]) || 0;

              return (
                <div
                  key={key}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block font-mono">{key}</span>
                    <span className="text-[11px] text-slate-500">
                      Current benchmark: {formatCentsToDollars(cents)} / night
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formValues[key] || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="w-24 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleSave(key)}
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition"
                    >
                      {isSaved ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
