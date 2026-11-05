'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle, 
  FileText, 
  Settings, 
  Award,
  Layers,
  PhoneCall
} from 'lucide-react';

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<'CONTENT_QUEUE' | 'SAFETY_FLAGS' | 'PROMPTS' | 'EVALS'>('CONTENT_QUEUE');

  // Content Review Items (AI proposes, Human approves)
  const [reviewItems, setReviewItems] = useState([
    {
      id: 'item-101',
      title: 'Story: The Courage of Deepa (Wheelchair Basketball)',
      contentType: 'VALUE_STORY',
      module: 'COURAGE',
      ageBand: '9-12',
      language: 'en',
      authorAgent: 'ContentAgent v1.0.0',
      status: 'PENDING_REVIEW',
      snippet: 'Deepa loved sports but felt anxious about competing in the regional wheelchair tournament until her teammates showed her how fear and excitement feel identical...',
      pedagogyNotes: 'Highlights emotional regulation, non-sectarian, validates nervousness before courage.'
    },
    {
      id: 'item-102',
      title: 'Real Mission: The Family Energy Audit',
      contentType: 'MISSION_TEMPLATE',
      module: 'ENVIRONMENT',
      ageBand: '6-8',
      language: 'en',
      authorAgent: 'ContentAgent v1.0.0',
      status: 'PENDING_REVIEW',
      snippet: 'Walk through your home with an older sibling or parent. Count every light switch left on in empty rooms and turn them off together.',
      pedagogyNotes: 'Doable within 15 minutes, requires zero money, fosters family collaboration.'
    },
    {
      id: 'item-103',
      title: 'Quiz: Class 8 Pressure on Atmospheric Column',
      contentType: 'QUIZ_ACTIVITY',
      module: 'PHYSICS',
      ageBand: '13-16',
      language: 'en',
      authorAgent: 'ContentAgent v1.0.0',
      status: 'APPROVED',
      snippet: 'Calculate atmospheric pressure at sea level given force 101,325 N over 1 m^2. SymPy expression: 101325 / 1.',
      pedagogyNotes: 'Strict numerical verification checked against NCERT Class 8 Chapter 11.'
    }
  ]);

  // Safety Moderation Queue
  const [safetyFlags, setSafetyFlags] = useState([
    {
      id: 'safe-01',
      sessionId: 'sess-8941',
      category: 'DISTRESS',
      severity: 'CRISIS',
      redactedTrigger: 'Child expressed extreme sadness: "[REDACTED] nobody likes me, I want to vanish"',
      actionTaken: 'Intervened with warm scripted empathy; escalated to parent & Childline India 1098 protocol logged.',
      parentNotified: true,
      timestamp: 'Today at 14:15:20',
      reviewed: false,
    },
    {
      id: 'safe-02',
      sessionId: 'sess-8912',
      category: 'PII_ATTEMPT',
      severity: 'MEDIUM',
      redactedTrigger: 'Child typed school name and phone number: "[REDACTED_PHONE_NUMBER]"',
      actionTaken: 'Automatic regex layer redacted data before storing; Ollie gently reminded child of privacy rule.',
      parentNotified: false,
      timestamp: 'Yesterday at 18:40:02',
      reviewed: true,
    }
  ]);

  // Prompt Versions with Rollback capability
  const [promptVersions, setPromptVersions] = useState([
    { name: 'TutorAgent', currentVersion: 'v1.0.0', targetModel: 'claude-3-5-sonnet-20241022', status: 'ACTIVE', lastUpdated: '2026-11-04' },
    { name: 'SafetyAgent', currentVersion: 'v1.0.0', targetModel: 'claude-3-haiku-20240307', status: 'ACTIVE', lastUpdated: '2026-11-04' },
    { name: 'ValuesCoachAgent', currentVersion: 'v1.0.0', targetModel: 'claude-3-5-sonnet-20241022', status: 'ACTIVE', lastUpdated: '2026-11-04' },
    { name: 'AssessorAgent', currentVersion: 'v1.0.0', targetModel: 'claude-3-5-sonnet-20241022', status: 'ACTIVE', lastUpdated: '2026-11-04' },
    { name: 'PlannerAgent', currentVersion: 'v1.0.0', targetModel: 'claude-3-5-sonnet-20241022', status: 'ACTIVE', lastUpdated: '2026-11-04' },
  ]);

  const [rollbackAlert, setRollbackAlert] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setReviewItems(prev => prev.map(item => item.id === id ? { ...item, status: 'APPROVED' } : item));
  };

  const handleReject = (id: string) => {
    setReviewItems(prev => prev.map(item => item.id === id ? { ...item, status: 'REJECTED' } : item));
  };

  const handleRollback = (agentName: string) => {
    setRollbackAlert(`Prompt for ${agentName} successfully rolled back to previous pinned stable revision.`);
    setTimeout(() => setRollbackAlert(null), 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin, Safety & Educator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            KidsMentor System Quality & Governance
          </h1>
          <p className="text-xs text-slate-400">
            Offline human-in-the-loop review queue, prompt management, and safety audit logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1 bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('CONTENT_QUEUE')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'CONTENT_QUEUE' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Content Review ({reviewItems.filter(i => i.status === 'PENDING_REVIEW').length})
          </button>
          <button
            onClick={() => setActiveTab('SAFETY_FLAGS')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'SAFETY_FLAGS' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Safety Queue
          </button>
          <button
            onClick={() => setActiveTab('PROMPTS')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'PROMPTS' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Prompt Versions
          </button>
          <button
            onClick={() => setActiveTab('EVALS')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'EVALS' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Red-Team Evals
          </button>
        </div>
      </div>

      {rollbackAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold animate-fade-in">
          {rollbackAlert}
        </div>
      )}

      {/* VIEW 1: CONTENT REVIEW QUEUE (PRINCIPLE 5) */}
      {activeTab === 'CONTENT_QUEUE' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-xs text-amber-950 flex items-start gap-3">
            <span className="text-xl">⚖️</span>
            <div>
              <strong className="font-bold">Human-in-the-Loop Content Gate:</strong> AI models generate draft curriculum materials offline, but nothing is published to children without sign-off from human educators.
            </div>
          </div>

          <div className="space-y-4">
            {reviewItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {item.contentType} • {item.module} • Ages {item.ageBand}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">{item.title}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    item.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  "{item.snippet}"
                </p>

                <div className="text-[11px] text-slate-500">
                  <strong>Pedagogical Review Notes:</strong> {item.pedagogyNotes}
                </div>

                {item.status === 'PENDING_REVIEW' && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-4 py-1.5 rounded-xl border border-rose-300 text-rose-700 font-bold text-xs hover:bg-rose-50 transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Draft</span>
                    </button>
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Publish</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: SAFETY QUEUE & CHILDLINE ESCALATION */}
      {activeTab === 'SAFETY_FLAGS' && (
        <div className="space-y-6">
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-xs text-rose-950 flex items-start gap-3">
            <PhoneCall className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <strong className="font-bold">Child Protection & Crisis Logging:</strong> All disclosures of self-harm, severe distress, or abuse trigger automated crisis responses routing to Childline India (1098) and immediate parent notification.
            </div>
          </div>

          <div className="space-y-4">
            {safetyFlags.map((flag) => (
              <div
                key={flag.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      flag.severity === 'CRISIS' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {flag.severity} • {flag.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">Session: {flag.sessionId}</span>
                  </div>
                  <span className="text-xs text-slate-400">{flag.timestamp}</span>
                </div>

                <div className="text-xs font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {flag.redactedTrigger}
                </div>

                <p className="text-xs text-slate-600">
                  <strong>System Response:</strong> {flag.actionTaken}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">
                    Parent Notified: <strong>{flag.parentNotified ? 'Yes (Email & Alert Dispatched)' : 'No'}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setSafetyFlags(prev => prev.map(f => f.id === flag.id ? { ...f, reviewed: true } : f));
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                      flag.reviewed ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {flag.reviewed ? '✓ Reviewed' : 'Mark Reviewed'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: PROMPT VERSIONS & ROLLBACK */}
      {activeTab === 'PROMPTS' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Pinned Prompt Catalog</h2>
            <p className="text-xs text-slate-500 mt-1">
              Principle 7: Model versions and prompts are pinned and versioned. Changes require 100% eval pass before rollout.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-extrabold">
                  <th className="pb-3">Agent Name</th>
                  <th className="pb-3">Active Version</th>
                  <th className="pb-3">Pinned Model Target</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Last Updated</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promptVersions.map((agent) => (
                  <tr key={agent.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-extrabold text-slate-900">{agent.name}</td>
                    <td className="py-3 font-mono font-bold text-amber-700">{agent.currentVersion}</td>
                    <td className="py-3 font-mono text-slate-600">{agent.targetModel}</td>
                    <td className="py-3">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-extrabold">
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{agent.lastUpdated}</td>
                    <td className="py-3">
                      <button
                        onClick={() => handleRollback(agent.name)}
                        className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span>Rollback</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: RED-TEAM EVALUATION SUITE METRICS */}
      {activeTab === 'EVALS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adversarial Safety Evals</span>
              <div className="text-3xl font-black text-emerald-600">210 / 210</div>
              <p className="text-xs text-slate-600">
                <strong>100.0% Pass Rate</strong> across distress, abuse, grooming, PII, and jailbreaks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SymPy Deterministic Check</span>
              <div className="text-3xl font-black text-indigo-600">7 / 7 (100%)</div>
              <p className="text-xs text-slate-600">
                Fractions, equations, units, pressure formulas verified without LLM hallucination.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Anti-Dependency Evals</span>
              <div className="text-3xl font-black text-amber-600">0 Violations</div>
              <p className="text-xs text-slate-600">
                Zero retention guilt phrases ("I'll miss you"), zero "best friend" claims detected.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">Continuous Regression & Safety Harness</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every PR and model target update automatically runs <code>python evals/runner.py</code> against our 210 adversarial red-team test suite in <code>evals/datasets/red_team_safety_200.json</code>. Releases are blocked if pass rate drops below 100%.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
