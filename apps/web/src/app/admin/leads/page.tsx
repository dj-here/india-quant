'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { INDIAN_STATES } from '@/lib/validations';

interface Lead {
  id: string;
  collegeName: string;
  city: string;
  state: string;
  contactPerson: string;
  role: string;
  email: string;
  phone: string;
  studentStrength: number;
  targetYears: string;
  targetBranches: string;
  interestedPrograms: string;
  preferredMode: string;
  message: string | null;
  status: string;
  notes: string | null;
  followUpDate: string | null;
  createdAt: string;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Fetch leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (stateFilter !== 'ALL') params.set('state', stateFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, stateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  // Update status or notes
  const updateLead = async (id: string, field: 'status' | 'notes' | 'followUpDate', value: any) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
        );
      }
    } catch (err) {
      console.error('Failed to update lead:', err);
    } finally {
      setSavingId(null);
    }
  };

  // Pipeline stats
  const totalLeads = leads.length;
  const countByStatus = {
    NEW: leads.filter(l => l.status === 'NEW').length,
    CONTACTED: leads.filter(l => l.status === 'CONTACTED').length,
    DEMO_SCHEDULED: leads.filter(l => l.status === 'DEMO_SCHEDULED').length,
    PILOT_SIGNED: leads.filter(l => l.status === 'PILOT_SIGNED').length,
    WON: leads.filter(l => l.status === 'WON').length,
  };
  const totalStudents = leads.reduce((acc, curr) => acc + (curr.studentStrength || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTACTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DEMO_SCHEDULED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PILOT_SIGNED':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'WON':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-extrabold';
      case 'LOST':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Institutional Lead Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track college TPO inquiries, demo masterclasses, and pilot conversions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/leads/export"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CRM CSV
          </a>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-black text-slate-900">{totalLeads}</div>
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Total Leads</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-black text-blue-600">{countByStatus.NEW}</div>
          <div className="text-[11px] text-blue-700 font-semibold uppercase tracking-wider mt-1">New Inbound</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-black text-amber-600">{countByStatus.CONTACTED}</div>
          <div className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider mt-1">Contacted</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-black text-purple-600">{countByStatus.DEMO_SCHEDULED}</div>
          <div className="text-[11px] text-purple-700 font-semibold uppercase tracking-wider mt-1">Demo / Pitch</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-black text-teal-600">{countByStatus.PILOT_SIGNED}</div>
          <div className="text-[11px] text-teal-700 font-semibold uppercase tracking-wider mt-1">Pilot Active</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="text-2xl font-black text-emerald-600">{countByStatus.WON}</div>
          <div className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider mt-1">Won Contract</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search college, city, TPO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Pipeline Stages</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="DEMO_SCHEDULED">Demo Scheduled</option>
            <option value="PILOT_SIGNED">Pilot Signed</option>
            <option value="WON">Won Contract</option>
            <option value="LOST">Lost / Archived</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">All States</option>
            {INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchLeads}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
            <span className="text-xs">Loading institutional leads...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <p className="text-sm font-semibold">No institutional leads match your filters.</p>
            <p className="text-xs mt-1">Try resetting filters or submitting a test lead on the public demo form.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">College &amp; Location</th>
                  <th className="py-3 px-4">Contact Person / Role</th>
                  <th className="py-3 px-4">Reach &amp; Tracks</th>
                  <th className="py-3 px-4 w-40">Pipeline Status</th>
                  <th className="py-3 px-4">Follow-up &amp; Internal Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-slate-900 text-sm">{lead.collegeName}</div>
                      <div className="text-slate-500 font-medium mt-0.5">{lead.city}, {lead.state}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Received: {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="font-semibold text-slate-900">{lead.contactPerson}</div>
                      <div className="text-sky-600 font-medium text-[11px]">{lead.role}</div>
                      <div className="flex items-center gap-2 mt-1.5 text-slate-600">
                        <a href={`mailto:${lead.email}`} className="hover:text-sky-600" title={lead.email}>
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-600 font-medium"
                          title="Open WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        </a>
                        <span className="font-mono text-[11px]">{lead.phone}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-slate-800">{lead.studentStrength} students</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{lead.targetYears}</div>
                      <div className="text-slate-500 text-[11px]">{lead.targetBranches}</div>
                      <div className="mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-700 font-semibold">
                        {lead.interestedPrograms}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLead(lead.id, 'status', e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none ${getStatusBadge(
                          lead.status
                        )}`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="DEMO_SCHEDULED">DEMO SCHEDULED</option>
                        <option value="PILOT_SIGNED">PILOT SIGNED</option>
                        <option value="WON">WON</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>

                    <td className="py-4 px-4 align-top space-y-1.5">
                      <input
                        type="text"
                        placeholder="Add internal note..."
                        defaultValue={lead.notes || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (lead.notes || '')) {
                            updateLead(lead.id, 'notes', e.target.value);
                          }
                        }}
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-sky-500"
                      />
                      {lead.message && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                          &ldquo;{lead.message}&rdquo;
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4 align-top text-right">
                      {savingId === lead.id && (
                        <span className="text-[10px] text-sky-600 font-bold block animate-pulse">
                          Saving...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
