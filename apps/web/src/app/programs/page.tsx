import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  Code2,
  BrainCircuit,
  Users2,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  Terminal,
  Zap,
  ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Curriculum & Placement Programs',
  description:
    'Comprehensive syllabi for Technical DSA (Java/C++/Python), Speed Quantitative Aptitude, and Corporate Finishing Grooming for college placement cells.',
};

export default function ProgramsPage() {
  const dsaWeeks = [
    { week: '01', topic: 'Complexity Analysis & Arrays I', practice: 'Prefix Sum, Two Sum, Kadane’s Algorithm (Max Subarray)' },
    { week: '02', topic: 'Arrays II, Two Pointers & Sliding Window', practice: '3Sum, Container With Most Water, Longest Substring Without Repeating' },
    { week: '03', topic: 'Searching & Sorting Algorithms', practice: 'Binary Search on Answer Space, Search in Rotated Array, QuickSelect' },
    { week: '04', topic: 'Strings & Pattern Matching', practice: 'Rolling Hash, Valid Anagram, Longest Palindromic Substring' },
    { week: '05', topic: 'Linked Lists (Singly, Doubly, Cyclic)', practice: 'Floyd’s Cycle Detection, Reverse in K-Groups, Merge Two Sorted Lists' },
    { week: '06', topic: 'Stacks & Queues (Linear & Monotonic)', practice: 'Monotonic Stack (Next Greater Element), Largest Rectangle in Histogram' },
    { week: '07', topic: 'Recursion & Backtracking', practice: 'Subsets, Permutations, Combination Sum, N-Queens' },
    { week: '08', topic: 'Mid-Term Comprehensive Mock Evaluation', practice: '3-Problem Timed Placement Simulation + Diagnostic Scorecards' },
    { week: '09', topic: 'Binary Trees & Traversals', practice: 'BFS Level Order, DFS (In/Pre/Post), Lowest Common Ancestor (LCA)' },
    { week: '10', topic: 'Binary Search Trees & Heaps / Priority Queues', practice: 'Validate BST, Top-K Frequent Elements, Find Median from Stream' },
    { week: '11', topic: 'Greedy Algorithms & Divide and Conquer', practice: 'Interval Scheduling, Non-overlapping Intervals, Gas Station' },
    { week: '12', topic: 'Dynamic Programming I (1D DP)', practice: 'Memoization vs Tabulation, Climbing Stairs, Coin Change, LIS' },
    { week: '13', topic: 'Dynamic Programming II (2D & Grid DP)', practice: '0/1 Knapsack, Longest Common Subsequence (LCS), Edit Distance' },
    { week: '14', topic: 'Graphs I (BFS, DFS, Cycles, TopoSort)', practice: 'Number of Islands, Course Schedule I & II, Rotting Oranges' },
    { week: '15', topic: 'Graphs II (Dijkstra’s Algorithm & DSU)', practice: 'Shortest Paths, Disjoint Set Union by Rank, Redundant Connection' },
    { week: '16', topic: 'Tries, Bit Manipulation & Grand Mock Drive', practice: 'Prefix Tree Autocomplete, Bitwise XOR, Final Placement Simulation' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-100/60 px-3 py-1 rounded-full">
            Detailed Syllabi & Learning Outcomes
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Rigorous, Company-Standard Curriculum
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Our multi-year progression covers every checkpoint of modern corporate recruitment—from initial online test filtering to final technical panel and HR negotiation rounds.
          </p>
        </div>

        {/* Navigation jump pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <a
            href="#dsa"
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm shadow-sm hover:border-sky-500 hover:text-sky-600 transition-colors flex items-center gap-2"
          >
            <Code2 className="w-4 h-4 text-sky-600" /> Technical DSA (96 Hours)
          </a>
          <a
            href="#aptitude"
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm shadow-sm hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            <BrainCircuit className="w-4 h-4 text-indigo-600" /> Cognitive Aptitude (60 Hours)
          </a>
          <a
            href="#soft-skills"
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm shadow-sm hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center gap-2"
          >
            <Users2 className="w-4 h-4 text-teal-600" /> Soft Skills & Mocks (36 Hours)
          </a>
        </div>

        {/* =====================================================================
            TRACK 1: DSA & ALGORITHMS
           ===================================================================== */}
        <section id="dsa" className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-12 shadow-sm mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200 gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sky-600 text-xs font-bold uppercase tracking-wider">
                <Code2 className="w-4 h-4" /> Pillar 01: Core Technical Track
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">
                Data Structures, Algorithms & Competitive Programming
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Taught in <strong className="text-slate-900">Java 21, C++20 (STL), or Python 3.11</strong>. Eliminates brute-force thinking and builds time/space optimized implementations required by TCS Digital, Infosys SP, Cognizant, and product firms.
              </p>
            </div>
            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-right shrink-0">
              <div className="text-2xl font-black text-sky-700">96 Hours</div>
              <div className="text-xs text-sky-600 font-medium">48h Interactive + 48h Lab</div>
            </div>
          </div>

          {/* Week by week table */}
          <div className="mt-8">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" /> 16-Week Algorithmic Progression
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 text-slate-700 font-bold text-xs border-b border-slate-200">
                    <th className="py-3 px-4 w-20">Week</th>
                    <th className="py-3 px-4">Core Algorithmic Module</th>
                    <th className="py-3 px-4">Sample Practice Problems (Easy / Medium / Hard)</th>
                    <th className="py-3 px-4 w-48 text-right">Assessment Rubric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dsaWeeks.map((item) => (
                    <tr key={item.week} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-600">W{item.week}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{item.topic}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{item.practice}</td>
                      <td className="py-3.5 px-4 text-right text-xs font-medium text-slate-500">
                        2 Code Tests + 10 MCQs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* =====================================================================
            TRACK 2: APTITUDE & COGNITIVE REASONING
           ===================================================================== */}
        <section id="aptitude" className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-12 shadow-sm mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200 gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                <BrainCircuit className="w-4 h-4" /> Pillar 02: Cognitive Evaluation Track
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">
                Quantitative Aptitude, Logical Reasoning & Verbal Ability
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                60% of students fail the first 60 minutes due to calculation speed and question selection errors. We teach high-speed Vedic shortcuts, elimination tactics, and company-specific question patterns.
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-right shrink-0">
              <div className="text-2xl font-black text-indigo-700">60 Hours</div>
              <div className="text-xs text-indigo-600 font-medium">30h Quant + 18h Logic + 12h Verbal</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 text-base mb-3 text-indigo-900">
                A. Quantitative Aptitude (30h)
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• Speed Math, Unit Digits & Remainder Theorems</li>
                <li>• Percentages, Profit & Loss, Marked Price</li>
                <li>• Simple & Compound Interest (Installment calculations)</li>
                <li>• Time and Work & Pipes and Cisterns</li>
                <li>• Time, Speed, Distance & Relative Speeds (Trains, Boats)</li>
                <li>• Permutations, Combinations & Probability</li>
                <li>• Ratio, Mixtures & Rule of Alligation</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 text-base mb-3 text-indigo-900">
                B. Logical Reasoning (18h)
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• Syllogisms (&quot;Only a few&quot; &amp; Possibility cases)</li>
                <li>• Blood Relations &amp; Coded Family Trees</li>
                <li>• Linear &amp; Circular Seating Arrangements</li>
                <li>• Direction Sense, Clocks &amp; Calendars</li>
                <li>• 2-Statement &amp; 3-Statement Data Sufficiency</li>
                <li>• Coding-Decoding &amp; Matrix Analogies</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 text-base mb-3 text-indigo-900">
                C. Verbal Ability (12h)
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>• Subject-Verb Agreement &amp; Modifier Errors</li>
                <li>• Reading Comprehension (Tone &amp; Inference)</li>
                <li>• Para Jumbles &amp; Chronological Triggers</li>
                <li>• Vocabulary in Context &amp; Idiomatic Phrasal Verbs</li>
                <li>• Active/Passive Voice &amp; Direct/Indirect Speech</li>
              </ul>
            </div>
          </div>
        </section>

        {/* =====================================================================
            TRACK 3: CORPORATE FINISHING & 1-ON-1 MOCKS
           ===================================================================== */}
        <section id="soft-skills" className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-12 shadow-sm mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200 gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider">
                <Users2 className="w-4 h-4" /> Pillar 03: Corporate Finishing Track
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">
                Soft Skills, Resume Engineering & 1-on-1 Mock Interviews
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                We groom students to crack behavioral, technical, and managerial interviews with confidence. Every student completes simulated group discussions and a 1-on-1 panel interview with an industry veteran.
              </p>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-right shrink-0">
              <div className="text-2xl font-black text-teal-700">36 Hours</div>
              <div className="text-xs text-teal-600 font-medium">Interactive Workshops + 1-on-1 Mocks</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">ATS-Compliant Resume Engineering</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Single-page, single-column technical resume formatted using the Google XYZ formula (&quot;Accomplished [X], as measured by [Y], by doing [Z]&quot;). 100% of resumes attain ATS score &gt;85.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Simulated Group Discussions (GD)</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Drills on abstract, tech-policy, and current affairs topics. Students learn initiation techniques, polite moderation, and body language under pressure.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">STAR Behavioral Interview Method</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Structuring narratives for situational questions (Situation, Task, Action, Result). Eliminates filler words, mother tongue influence (MTI), and hesitation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Individual 1-on-1 Panel Mock Interview</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    A rigorous 30-minute private technical and HR mock round conducted by an external industry lead, concluding with an individual written diagnostic report.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <div className="text-center bg-slate-900 rounded-3xl p-10 text-white space-y-4">
          <h3 className="text-2xl font-bold">Want to customize this syllabus for your university regulations?</h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            We adapt modules to match SPPU, VTU, Anna University, AKTU, or autonomous college lab syllabi.
          </p>
          <div className="pt-2">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-colors"
            >
              Request Custom Proposal & Demo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
