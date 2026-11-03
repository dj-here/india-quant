'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Timer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  BarChart3,
  Share2,
  Printer,
  Sparkles,
  Building2,
  RotateCcw,
  Loader2,
  ChevronRight
} from 'lucide-react';

interface QuestionItem {
  id: string;
  index: number;
  section: string;
  subTopic: string;
  difficulty: string;
  questionText: string;
  codeSnippet: string | null;
  options: string[];
}

interface EvaluationResult {
  totalScore: number;
  totalQuestions: number;
  percentage: number;
  quantScore: number;
  logicalScore: number;
  verbalScore: number;
  dsaScore: number;
  readinessBand: 'SUPER_DREAM_READY' | 'PLACEMENT_READY' | 'FOUNDATION_NEEDED';
  readinessTitle: string;
  readinessDescription: string;
  recommendedAction: string;
  studentName: string;
  collegeName: string;
  branch: string;
  graduationYear: number;
  timeTakenSeconds: number;
}

interface QuestionReview {
  id: string;
  section: string;
  subTopic: string;
  difficulty: string;
  questionText: string;
  codeSnippet: string | null;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
}

export default function AssessmentPage() {
  const [step, setStep] = useState<'REGISTER' | 'TEST' | 'RESULTS'>('REGISTER');

  // Student details
  const [studentInfo, setStudentInfo] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    collegeName: '',
    branch: 'Computer Science & Engineering',
    graduationYear: 2026,
    consentDPDP: true,
  });

  // Test state
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 mins in secs
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [reviews, setReviews] = useState<QuestionReview[]>([]);

  // 1. Fetch questions on clicking start test
  const handleStartTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/assessment/questions');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load test questions.');
      }

      setQuestions(data.questions);
      setCurrentIdx(0);
      setUserAnswers({});
      setTimeLeft(20 * 60);
      setTestStartTime(Date.now());
      setStep('TEST');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error initializing assessment.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Countdown timer effect
  useEffect(() => {
    if (step !== 'TEST') return;

    if (timeLeft <= 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const selectOption = (questionId: string, optionIdx: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  // 3. Submit test to backend
  const handleSubmitTest = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    const timeTaken = Math.min(
      Math.floor((Date.now() - testStartTime) / 1000),
      20 * 60
    );

    try {
      const payload = {
        ...studentInfo,
        timeTakenSeconds: timeTaken,
        answers: userAnswers,
      };

      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit assessment.');
      }

      setEvaluation(data.evaluation);
      setReviews(data.questionReviews);
      setStep('RESULTS');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting test.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* =====================================================================
            STAGE 1: REGISTRATION & INSTRUCTIONS
           ===================================================================== */}
        {step === 'REGISTER' && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-100/60 px-3 py-1 rounded-full">
                Placement Readiness Diagnostic
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Free Student Placement Readiness Test
              </h1>
              <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                A 20-question timed diagnostic test measuring your aptitude and coding logic against actual campus hiring test cutoffs of TCS, Infosys, Cognizant, and product companies.
              </p>
            </div>

            {/* Test Specifications Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" /> Test Blueprint &amp; Structure
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="font-mono text-xl font-bold text-slate-900">20 MCQs</div>
                  <div className="text-slate-500 mt-0.5">Total Questions</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="font-mono text-xl font-bold text-sky-600">20 Mins</div>
                  <div className="text-slate-500 mt-0.5">Strict Time Limit</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="font-mono text-xl font-bold text-emerald-600">4 Sections</div>
                  <div className="text-slate-500 mt-0.5">Quant, Logic, Verbal, DSA</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="font-mono text-xl font-bold text-indigo-600">Instant</div>
                  <div className="text-slate-500 mt-0.5">Diagnostic Report</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                <p>• <strong>5 Questions:</strong> Speed Quantitative Aptitude (Time-Work, Percentages, Numbers)</p>
                <p>• <strong>5 Questions:</strong> Logical Reasoning &amp; Puzzles (Syllogisms, Blood Relations, Seating)</p>
                <p>• <strong>5 Questions:</strong> Verbal Ability &amp; Corporate Communication (Grammar, Inferences)</p>
                <p>• <strong>5 Questions:</strong> Basic DSA &amp; Algorithmic Logic (Arrays, Lists, Stacks, Complexity)</p>
              </div>
            </div>

            {/* Registration Form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-6">
                Enter Candidate Details to Begin Test
              </h2>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleStartTest} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aditya Sharma"
                      value={studentInfo.studentName}
                      onChange={(e) => setStudentInfo({ ...studentInfo, studentName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="aditya@college.edu.in"
                      value={studentInfo.studentEmail}
                      onChange={(e) => setStudentInfo({ ...studentInfo, studentEmail: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98220 11223"
                      value={studentInfo.studentPhone}
                      onChange={(e) => setStudentInfo({ ...studentInfo, studentPhone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      College / Institute Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vidyapeeth Institute of Technology"
                      value={studentInfo.collegeName}
                      onChange={(e) => setStudentInfo({ ...studentInfo, collegeName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Department / Branch *
                    </label>
                    <select
                      value={studentInfo.branch}
                      onChange={(e) => setStudentInfo({ ...studentInfo, branch: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium bg-white"
                    >
                      <option value="Computer Science & Engineering">Computer Science &amp; Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="AI / Machine Learning / Data Science">AI / Machine Learning / Data Science</option>
                      <option value="Electronics & Communication (ECE)">Electronics &amp; Communication (ECE)</option>
                      <option value="Electrical Engineering (EEE)">Electrical Engineering (EEE)</option>
                      <option value="Mechanical / Civil Engineering">Mechanical / Civil Engineering</option>
                      <option value="MCA / BCA / B.Sc CS">MCA / BCA / B.Sc CS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Graduation Year *
                    </label>
                    <select
                      value={studentInfo.graduationYear}
                      onChange={(e) => setStudentInfo({ ...studentInfo, graduationYear: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium bg-white"
                    >
                      <option value={2025}>2025 (Final Year)</option>
                      <option value={2026}>2026 (Pre-Final Year)</option>
                      <option value={2027}>2027 (2nd Year)</option>
                      <option value={2028}>2028 (1st Year)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={studentInfo.consentDPDP}
                      onChange={(e) => setStudentInfo({ ...studentInfo, consentDPDP: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-xs text-slate-600">
                      I consent to processing my assessment responses strictly for scoring, diagnostic feedback, and placement benchmark analysis under the <strong>DPDP Act, 2023</strong>.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-lg shadow-sky-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Preparing 20 Balanced Questions...
                    </>
                  ) : (
                    <>
                      Start 20-Minute Assessment <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            STAGE 2: PROCTORED 20-QUESTION TEST RUNNER
           ===================================================================== */}
        {step === 'TEST' && questions.length > 0 && (
          <div className="space-y-6">
            
            {/* Top Fixed Header with Timer */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between sticky top-20 z-40">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">
                  Question <strong className="text-slate-900">{currentIdx + 1}</strong> of {questions.length}
                </span>
                <span className="text-xs bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold text-slate-700">
                  {questions[currentIdx]?.section} • {questions[currentIdx]?.subTopic}
                </span>
              </div>

              <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono font-bold text-sm ${
                timeLeft < 180 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-800'
              }`}>
                <Timer className="w-4 h-4 text-sky-600" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            </div>

            {/* Question Quick Jump Ribbon */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex flex-wrap gap-1.5 justify-center">
              {questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-sky-600 text-white ring-2 ring-sky-600 ring-offset-1'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Active Question Box */}
            {(() => {
              const currentQ = questions[currentIdx];
              if (!currentQ) return null;

              return (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                        {currentQ.section} &bull; {currentQ.difficulty}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 whitespace-pre-line leading-relaxed">
                        {currentQ.questionText}
                      </h3>
                    </div>
                  </div>

                  {currentQ.codeSnippet && (
                    <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-sky-300 overflow-x-auto">
                      <pre>{currentQ.codeSnippet}</pre>
                    </div>
                  )}

                  {/* Options list */}
                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((opt, oIdx) => {
                      const isSelected = userAnswers[currentQ.id] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => selectOption(currentQ.id, oIdx)}
                          className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-sky-50 border-sky-500 text-sky-950 font-semibold ring-1 ring-sky-500'
                              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isSelected ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((prev) => prev - 1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-30 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Previous
                    </button>

                    <div className="flex items-center gap-3">
                      {currentIdx < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentIdx((prev) => prev + 1)}
                          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          Next <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleSubmitTest}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        >
                          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Finish &amp; Get Score
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Bottom Final Submit Trigger */}
            <div className="bg-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <span className="text-slate-600">
                Answered: <strong className="text-slate-900">{Object.keys(userAnswers).length}</strong> / 20 questions
              </span>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitTest}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
              >
                Submit Assessment Now
              </button>
            </div>

          </div>
        )}

        {/* =====================================================================
            STAGE 3: DIAGNOSTIC SCORECARD & QUESTION REVIEWS
           ===================================================================== */}
        {step === 'RESULTS' && evaluation && (
          <div className="space-y-8">
            
            {/* Header Result Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-100/60 px-3 py-1 rounded-full">
                Assessment Verified &amp; Processed
              </span>
              
              <h2 className="text-3xl font-black text-slate-900">
                Placement Readiness Scorecard
              </h2>
              
              <div className="text-xs text-slate-500">
                Candidate: <strong className="text-slate-800">{evaluation.studentName}</strong> • {evaluation.collegeName} ({evaluation.branch})
              </div>

              {/* Big Score Display */}
              <div className="py-6 flex items-center justify-center gap-8 border-y border-slate-100">
                <div className="text-center">
                  <div className="text-5xl font-black text-slate-900">
                    {evaluation.totalScore} <span className="text-2xl text-slate-400">/ 20</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Raw MCQ Score</div>
                </div>
                <div className="h-12 w-px bg-slate-200"></div>
                <div className="text-center">
                  <div className="text-5xl font-black text-sky-600">
                    {evaluation.percentage}%
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Overall Percentile</div>
                </div>
              </div>

              {/* Readiness Band Box */}
              <div className={`p-6 rounded-2xl text-left border ${
                evaluation.readinessBand === 'SUPER_DREAM_READY'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : evaluation.readinessBand === 'PLACEMENT_READY'
                  ? 'bg-sky-50 border-sky-200 text-sky-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-2 font-black text-base">
                  <Award className="w-5 h-5 text-current" />
                  <span>{evaluation.readinessTitle}</span>
                </div>
                <p className="text-xs mt-2 leading-relaxed">
                  {evaluation.readinessDescription}
                </p>
                <div className="mt-3 pt-3 border-t border-current/20 text-xs font-bold">
                  Recommended Focus: {evaluation.recommendedAction}
                </div>
              </div>

              {/* Section Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-mono text-xl font-bold text-slate-900">{evaluation.quantScore} / 5</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Quantitative Aptitude</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-mono text-xl font-bold text-slate-900">{evaluation.logicalScore} / 5</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Logical Reasoning</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-mono text-xl font-bold text-slate-900">{evaluation.verbalScore} / 5</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Verbal Ability</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-mono text-xl font-bold text-slate-900">{evaluation.dsaScore} / 5</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Basic DSA &amp; Logic</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <Link
                  href="/demo"
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md"
                >
                  Conduct this Test for Your Entire College Batch →
                </Link>
              </div>

            </div>

            {/* Detailed Question Review List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 px-2 flex items-center justify-between">
                <span>Detailed Question Review &amp; Explanations</span>
                <span className="text-xs font-normal text-slate-500">20 Questions Reviewed</span>
              </h3>

              {reviews.map((rev, idx) => (
                <div
                  key={rev.id}
                  className={`bg-white rounded-2xl border p-6 shadow-sm space-y-3 ${
                    rev.isCorrect ? 'border-emerald-200' : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Q{idx + 1} &bull; {rev.section} ({rev.subTopic})</span>
                    {rev.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+1)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect / Unanswered
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-slate-900 text-sm whitespace-pre-line">
                    {rev.questionText}
                  </p>

                  {rev.codeSnippet && (
                    <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-sky-300">
                      <pre>{rev.codeSnippet}</pre>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {rev.options.map((opt, oIdx) => {
                      const isCorrectAnswer = oIdx === rev.correctAnswer;
                      const isUserChoice = oIdx === rev.selectedAnswer;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-lg border font-medium flex items-center justify-between ${
                            isCorrectAnswer
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                              : isUserChoice && !rev.isCorrect
                              ? 'bg-rose-50 border-rose-300 text-rose-950 line-through'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                          {isCorrectAnswer && <span className="text-[10px] text-emerald-700 font-extrabold uppercase">Correct</span>}
                          {isUserChoice && !isCorrectAnswer && <span className="text-[10px] text-rose-700 font-bold uppercase">Your Pick</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 block mb-0.5">Explanation:</strong>
                    {rev.explanation}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA for Colleges */}
            <div className="text-center bg-slate-900 rounded-3xl p-10 text-white space-y-4">
              <h3 className="text-2xl font-bold">Want to benchmark your entire department?</h3>
              <p className="text-slate-300 text-sm max-w-xl mx-auto">
                CampusEdge provides an institutional testing portal that generates batch-wide rank lists, section weakness heatmaps, and NBA Criterion 4 tables in 1 click.
              </p>
              <div className="pt-2">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-colors"
                >
                  Conduct Batch Diagnostic Test <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
