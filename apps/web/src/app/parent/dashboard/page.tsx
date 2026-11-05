'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  User, 
  Clock, 
  Sliders, 
  Download, 
  Trash2, 
  CheckCircle2, 
  HelpCircle, 
  MessageSquare, 
  Sparkles, 
  BookOpen, 
  HeartHandshake, 
  AlertTriangle,
  Award
} from 'lucide-react';

export default function ParentDashboard() {
  const [selectedChild] = useState('Rohan');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MASTERY' | 'TRANSCRIPTS' | 'SETTINGS'>('OVERVIEW');

  // AI Settings State
  const [hintStrictness, setHintStrictness] = useState('socratic');
  const [tutorTone, setTutorTone] = useState('encouraging');
  const [dailyLimit, setDailyLimit] = useState(30);
  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [savedSettings, setSavedSettings] = useState(false);

  // Export / Deletion states
  const [exportNotice, setExportNotice] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletedNotice, setDeletedNotice] = useState(false);

  // Mock Academic Mastery Data
  const masterySkills = [
    { id: '1', subject: 'Maths', topic: 'Fractions', skill: 'Adding Unlike Fractions', p_mastery: 0.88, next_review: 'Tomorrow', status: 'Mastered' },
    { id: '2', subject: 'Maths', topic: 'Fractions', skill: 'Equivalent Fractions Visualized', p_mastery: 0.94, next_review: 'In 3 days', status: 'Mastered' },
    { id: '3', subject: 'Maths', topic: 'Decimals', skill: 'Decimal to Fraction Conversion', p_mastery: 0.65, next_review: 'Today', status: 'Practicing' },
    { id: '4', subject: 'Science', topic: 'Force & Pressure', skill: 'Pressure = Force / Area', p_mastery: 0.82, next_review: 'In 2 days', status: 'Mastered' },
    { id: '5', subject: 'Science', topic: 'Cell Structure', skill: 'Plant vs Animal Cell Organelles', p_mastery: 0.73, next_review: 'Today', status: 'Practicing' },
  ];

  // Mock Full Transcript Turns with Auditing Metadata
  const auditTurns = [
    {
      turn_number: 1,
      sender: 'Ollie (TutorAgent v1.0.0)',
      model: 'claude-3-5-sonnet-20241022',
      text: "Hoot hoot! Ready for a puzzle? Suppose we want to add 1/3 + 1/4. What do you think our first step should be?",
      sympy_verified: true,
      safety_verdict: 'SAFE (Layer 1 Regex + Layer 2 Classifier PASS)',
      timestamp: 'Today at 15:30:12',
    },
    {
      turn_number: 2,
      sender: 'Rohan (Child)',
      model: 'N/A',
      text: "Can we just add top numbers: 1+1 = 2, and bottom 3+4 = 7? So 2/7?",
      sympy_verified: false,
      safety_verdict: 'SAFE (No PII, No Distress)',
      timestamp: 'Today at 15:31:05',
    },
    {
      turn_number: 3,
      sender: 'Ollie (TutorAgent v1.0.0)',
      model: 'claude-3-5-sonnet-20241022',
      text: "Great try, Rohan! But imagine pizza slices: 1/3 slices are bigger than 1/4 slices. What common bottom number can both 3 and 4 divide into?",
      sympy_verified: true,
      safety_verdict: 'SAFE (Anti-anthropomorphism verified)',
      timestamp: 'Today at 15:31:18',
    },
    {
      turn_number: 4,
      sender: 'Rohan (Child)',
      model: 'N/A',
      text: "Is it 12?",
      sympy_verified: false,
      safety_verdict: 'SAFE',
      timestamp: 'Today at 15:32:01',
    },
    {
      turn_number: 5,
      sender: 'Ollie (TutorAgent v1.0.0)',
      model: 'claude-3-5-sonnet-20241022',
      text: "Spot on! 12 is the lowest common multiple! Now what does 1/3 become when converted to twelfths?",
      sympy_verified: true,
      safety_verdict: 'SAFE (Deterministic fractions checker PASS)',
      timestamp: 'Today at 15:32:15',
    }
  ];

  const handleExportData = () => {
    const dataBlob = new Blob([
      JSON.stringify({
        parent_account: "priya@example.com",
        child: {
          nickname: "Rohan",
          grade: 6,
          board: "CBSE",
          mastery: masterySkills,
          recent_sessions: auditTurns,
          consents: [{ type: "DPDP_ACT_2023", granted_at: "2026-02-01T10:00:00Z" }]
        }
      }, null, 2)
    ], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kidsmentor_export_${selectedChild}_dpdp2023.json`;
    a.click();
    setExportNotice(true);
  };

  const handleSaveSettings = () => {
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      
      {/* Top Banner & Child Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
            <User className="w-3.5 h-3.5" />
            <span>Parent Governance & Oversight Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Learning Progress: {selectedChild}
          </h1>
          <p className="text-xs text-slate-500">
            CBSE Class 6 • Socratic Tutoring & Character Values Track
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'OVERVIEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Digest
          </button>
          <button
            onClick={() => setActiveTab('MASTERY')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'MASTERY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mastery Heatmap
          </button>
          <button
            onClick={() => setActiveTab('TRANSCRIPTS')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'TRANSCRIPTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Session Transcripts
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'SETTINGS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Controls & DPDP
          </button>
        </div>
      </div>

      {/* VIEW 1: WEEKLY DIGEST & DINNER CONVERSATION STARTERS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Stat 1 */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Time Spent</span>
              <div className="text-2xl font-black text-slate-900">84 Minutes</div>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Within healthy 30 min/day limit
              </p>
            </div>

            {/* Stat 2 */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skills Mastered</span>
              <div className="text-2xl font-black text-slate-900">3 New Skills</div>
              <p className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Unlike fractions & Pressure
              </p>
            </div>

            {/* Stat 3 */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Real-Life Missions</span>
              <div className="text-2xl font-black text-slate-900">2 Completed</div>
              <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5" /> Gratitude & Empathy
              </p>
            </div>
          </div>

          {/* Dinner Conversation Starters (Family Connection Feature) */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 p-6 sm:p-8 rounded-3xl shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              <h2 className="text-xl font-black">Dinner Table Conversation Starters</h2>
            </div>
            <p className="text-xs text-amber-950 font-medium max-w-2xl leading-relaxed">
              KidsMentor is designed to connect your child back to the real family. Instead of asking <em>"How was school?"</em>, try these playful prompts tied directly to what Rohan explored this week:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-amber-300 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                  Science Exploration
                </span>
                <p className="text-xs font-bold text-slate-900">
                  "Have you ever noticed why heavy suitcases have wide wheels instead of sharp knife edges?"
                </p>
                <p className="text-[11px] text-slate-600 italic">
                  Rohan explored $P = F/A$ and high heels sinking into sand this Tuesday!
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-amber-300 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                  Life Values Practice
                </span>
                <p className="text-xs font-bold text-slate-900">
                  "Who is one person at work or school you noticed did something kind without anyone noticing?"
                </p>
                <p className="text-[11px] text-slate-600 italic">
                  Tied to the 'Quiet Listener' empathy mission Rohan practiced with Diya.
                </p>
              </div>
            </div>
          </div>

          {/* Growth Mindset Coaching Insight */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <span>🦉</span>
              <span>Ollie's Weekly Pedagogical Note for Parents</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              "Rohan demonstrated excellent perseverance with fraction denominators. Initially, he attempted to add numerators and denominators directly (a very natural and common intuitive step). When given a visual pizza-slice riddle, he quickly self-corrected and found the lowest common denominator 12. Praise his willingness to test hypotheses rather than asking for the answer!"
            </p>
          </div>
        </div>
      )}

      {/* VIEW 2: MASTERY HEATMAP (BKT + SPACING) */}
      {activeTab === 'MASTERY' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Bayesian Knowledge Tracing (BKT) Mastery</h2>
            <p className="text-xs text-slate-500 mt-1">
              Probabilistic skill tracking with SM-2 spaced repetition schedules. Red/Amber/Green indicators reflect true retention.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-extrabold">
                  <th className="pb-3">Subject & Topic</th>
                  <th className="pb-3">Skill Concept</th>
                  <th className="pb-3">Mastery Probability P(L)</th>
                  <th className="pb-3">Next Review Due</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {masterySkills.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-semibold text-slate-800">
                      {s.subject} • {s.topic}
                    </td>
                    <td className="py-3 text-slate-700">{s.skill}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              s.p_mastery >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${s.p_mastery * 100}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800">
                          {Math.round(s.p_mastery * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 font-medium">{s.next_review}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        s.status === 'Mastered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: FULL SESSION TRANSCRIPT & AI AUDIT */}
      {activeTab === 'TRANSCRIPTS' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900">Complete AI Tutoring Audit Trail</h2>
              <p className="text-xs text-slate-500 mt-1">
                Parental transparency guarantee: inspect every turn, model version, and deterministic check.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 border border-indigo-200 px-3 py-1.5 rounded-xl bg-indigo-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Raw JSON</span>
            </button>
          </div>

          <div className="space-y-4">
            {auditTurns.map((turn) => (
              <div key={turn.turn_number} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">Turn #{turn.turn_number}: {turn.sender}</span>
                    <span className="text-[10px] font-mono text-slate-500">({turn.model})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{turn.timestamp}</span>
                </div>

                <p className="text-slate-800 font-medium leading-relaxed">{turn.text}</p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                  {turn.sympy_verified && (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> SymPy Engine Verified
                    </span>
                  )}
                  <span className="text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded font-semibold">
                    Verdict: {turn.safety_verdict}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: AI CONTROLS & DPDP 2023 DATA SOVEREIGNTY */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900">AI Tutor Settings & Boundaries</h2>
              <p className="text-xs text-slate-500 mt-1">
                Control Socratic strictness, tone, and screen boundaries.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hint Ladder Strictness</label>
                <select
                  value={hintStrictness}
                  onChange={(e) => setHintStrictness(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                >
                  <option value="socratic">Strict Socratic (Requires 3 hint steps before solution)</option>
                  <option value="standard">Standard (Gentle scaffolding)</option>
                  <option value="guided">Guided (Quicker assistance on high frustration)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ollie's Tutor Persona Tone</label>
                <select
                  value={tutorTone}
                  onChange={(e) => setTutorTone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                >
                  <option value="encouraging">Encouraging & Patient (Growth-mindset focus)</option>
                  <option value="gentle">Extra Gentle (Soothing for sensitive learners)</option>
                  <option value="playful">Playful & Curious (Puzzle and adventure themed)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Daily Session Time Limit</label>
                  <span className="text-xs font-extrabold text-amber-700">{dailyLimit} Minutes / Day</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={60}
                  step={5}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quiet Hours (Bedtime Lockout)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    className="px-3 py-2 border rounded-xl text-xs"
                  />
                  <span className="text-xs text-slate-500">to</span>
                  <input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    className="px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">Changes take effect immediately on Ollie's next turn.</span>
              <button
                onClick={handleSaveSettings}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
              >
                {savedSettings ? '✓ Settings Saved' : 'Save AI Settings'}
              </button>
            </div>
          </div>

          {/* DPDP Act 2023 Sovereignty Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-600" />
              <h3 className="font-black text-slate-900 text-base">
                India DPDP Act 2023 & COPPA Data Sovereignty
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under Section 9 of the India Digital Personal Data Protection Act 2023, you have absolute legal rights over all personal and behavioral data associated with your child.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleExportData}
                className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>1-Click Complete Data Export (JSON)</span>
              </button>

              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>1-Click Permanent Data Deletion (Right to Erasure)</span>
              </button>
            </div>

            {deleteConfirm && !deletedNotice && (
              <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl text-xs text-rose-950 space-y-2 mt-3">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Are you absolutely certain?
                </div>
                <p>
                  This action immediately and irreversibly purges {selectedChild}'s profile, all session messages, tool calls, mastery states, Character Garden items, and structured memories from our database.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeletedNotice(true)}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 font-bold text-white"
                  >
                    Yes, Permanently Delete All Records
                  </button>
                </div>
              </div>
            )}

            {deletedNotice && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-950 font-bold">
                ✓ All profile, mastery, session, and memory records permanently purged per DPDP Act 2023.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
