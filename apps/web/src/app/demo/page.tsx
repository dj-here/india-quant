'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  HelpCircle,
  Check
} from 'lucide-react';
import { INDIAN_STATES } from '@/lib/validations';

export default function DemoRequestPage() {
  const [formData, setFormData] = useState({
    collegeName: '',
    city: '',
    state: 'Maharashtra',
    contactPerson: '',
    role: 'TPO',
    email: '',
    phone: '',
    studentStrength: 180,
    targetYears: '3rd Year (Sem 5/6)',
    targetBranches: 'CSE, IT, ECE',
    interestedPrograms: 'DSA, Aptitude, Soft Skills',
    preferredMode: 'ON_CAMPUS' as 'ON_CAMPUS' | 'HYBRID' | 'ONLINE',
    message: '',
    website_url_hp: '', // Honeypot field
    consentDPDP: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit proposal request. Please check inputs.');
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-100/60 px-3 py-1 rounded-full">
            For College Leadership &amp; TPOs
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Request a Free Demo / Institutional Proposal
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Invite our ex-FAANG trainers for a complimentary 90-minute live masterclass for your students, or request a customized 120h/200h placement proposal.
          </p>
        </div>

        {success ? (
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Proposal Request Received!
            </h2>
            <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
              Thank you, <strong>{formData.contactPerson}</strong>. A confirmation email has been dispatched to <strong>{formData.email}</strong>. Our Head of Institutional Partnerships is reviewing your college calendar and will contact you within <strong>24 business hours</strong>.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left max-w-md mx-auto text-xs space-y-2 text-slate-700">
              <div className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">Registered Details:</div>
              <div>• <strong>College:</strong> {formData.collegeName} ({formData.city}, {formData.state})</div>
              <div>• <strong>Role:</strong> {formData.role}</div>
              <div>• <strong>Student Strength:</strong> {formData.studentStrength} students</div>
              <div>• <strong>Preferred Tracks:</strong> {formData.interestedPrograms}</div>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/assessment"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-colors"
              >
                Try Student Readiness Assessment →
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm">
            {errorMsg && (
              <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Submission Error:</strong>
                  {errorMsg}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Anti-spam hidden honeypot */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website_url_hp">Leave this empty</label>
                <input
                  type="text"
                  id="website_url_hp"
                  name="website_url_hp"
                  value={formData.website_url_hp}
                  onChange={(e) => setFormData({ ...formData, website_url_hp: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Institution Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    College / Institute Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vidyapeeth Institute of Technology"
                    value={formData.collegeName}
                    onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune, Mangaluru, Coimbatore"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>
              </div>

              {/* State & Role Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    State *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Your Institutional Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium bg-white"
                  >
                    <option value="Head - T&P Cell (TPO)">Head - T&amp;P Cell (TPO)</option>
                    <option value="Principal / Director">Principal / Director</option>
                    <option value="Dean - Career Services / Academics">Dean - Career Services / Academics</option>
                    <option value="Head of Department (HoD CSE/IT/ECE)">Head of Department (HoD CSE/IT/ECE)</option>
                    <option value="Management Trustee / Chairman">Management Trustee / Chairman</option>
                    <option value="Faculty Placement Coordinator">Faculty Placement Coordinator</option>
                  </select>
                </div>
              </div>

              {/* Contact Person & Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Rajesh Shinde"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Official College Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tpo@college.edu.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Mobile / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98230 44556"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Student Cohort Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Estimated Student Strength *
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    required
                    value={formData.studentStrength}
                    onChange={(e) => setFormData({ ...formData, studentStrength: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Target Cohort / Years *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3rd Year, Final Year, MCA"
                    value={formData.targetYears}
                    onChange={(e) => setFormData({ ...formData, targetYears: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Target Branches *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE, IT, ECE, AIML"
                    value={formData.targetBranches}
                    onChange={(e) => setFormData({ ...formData, targetBranches: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Interested Programs & Preferred Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Interested Training Tracks *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Placement Accelerator (DSA + Aptitude + Mocks)"
                    value={formData.interestedPrograms}
                    onChange={(e) => setFormData({ ...formData, interestedPrograms: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Preferred Delivery Mode *
                  </label>
                  <select
                    value={formData.preferredMode}
                    onChange={(e) => setFormData({ ...formData, preferredMode: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium bg-white"
                  >
                    <option value="ON_CAMPUS">On-Campus In-Person Intensive</option>
                    <option value="HYBRID">Blended Hybrid (Labs on campus + live virtual)</option>
                    <option value="ONLINE">Live Interactive Virtual Studio</option>
                  </select>
                </div>
              </div>

              {/* Specific message / timetable constraints */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Specific Objectives, Expected Dates, or Questions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. We have campus hiring commencing in August. Want a 2-week pilot next month for our CSE section of 60 students..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                />
              </div>

              {/* DPDP Act 2023 Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.consentDPDP}
                    onChange={(e) => setFormData({ ...formData, consentDPDP: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I consent to CampusEdge collecting and processing my institutional contact details strictly for placement assessment and training communications in accordance with India&apos;s <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>. Data is never sold or shared.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-lg shadow-sky-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Submit Free Demo &amp; Proposal Request
                    </>
                  )}
                </button>
              </div>

              <div className="text-center text-xs text-slate-400">
                * Zero budgetary obligation. Submitting this form does not bind your institution to any contract.
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
