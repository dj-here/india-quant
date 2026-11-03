'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, BarChart3, Award, Users, Search, Loader2 } from 'lucide-react';

interface CollegeAggregate {
  collegeName: string;
  testTakers: number;
  averagePercentage: number;
  superDreamRatio: number;
}

export default function AdminAssessmentsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/assessment/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load assessment stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Student Readiness Assessment Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Aggregated diagnostic metrics across partner engineering colleges.
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
          <span className="text-xs">Loading assessment metrics...</span>
        </div>
      ) : !stats ? (
        <div className="p-16 text-center text-slate-400">Failed to load statistics.</div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-slate-900">{stats.totalSubmissions}</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Total Test Takers</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-sky-600">{stats.averageScore}%</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Average Percentile</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-emerald-600">{stats.bandCounts.SUPER_DREAM_READY}</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Super-Dream Ready (&gt;80%)</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-amber-600">{stats.bandCounts.FOUNDATION_NEEDED}</div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Remedial Focus (&lt;55%)</div>
            </div>
          </div>

          {/* College-Wise Aggregates Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">College-Wise Performance Aggregates</h2>
                <p className="text-xs text-slate-500 mt-0.5">Benchmarking cohorts for institutional presentations</p>
              </div>
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                {stats.collegeAggregates.length} Institutions Tracked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">College Name</th>
                    <th className="py-3 px-4 text-center">Students Evaluated</th>
                    <th className="py-3 px-4 text-center">Average Percentile</th>
                    <th className="py-3 px-4 text-center">Tier-1 Ready Ratio</th>
                    <th className="py-3 px-4 text-right">Placement Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.collegeAggregates.map((col: CollegeAggregate) => (
                    <tr key={col.collegeName} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                        {col.collegeName}
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-slate-800">
                        {col.testTakers}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-sky-600 text-sm">
                        {col.averagePercentage}%
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-xs">
                          {col.superDreamRatio}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-600">
                        {col.averagePercentage >= 70
                          ? 'Recommend: 200h Placement Accelerator'
                          : 'Recommend: 120h Foundation Track'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
