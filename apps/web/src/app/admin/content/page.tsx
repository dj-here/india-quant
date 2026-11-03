'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Plus, Loader2, CheckCircle2 } from 'lucide-react';

export default function AdminContentPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New testimonial form state
  const [newTestimonial, setNewTestimonial] = useState({
    authorName: '',
    designation: 'Head - T&P Cell',
    collegeName: '',
    city: '',
    quote: '',
    rating: 5,
  });

  // New FAQ form state
  const [newFaq, setNewFaq] = useState({
    category: 'COLLEGES',
    question: '',
    answer: '',
  });

  const [savingT, setSavingT] = useState(false);
  const [savingF, setSavingF] = useState(false);

  useEffect(() => {
    async function loadContent() {
      try {
        const [tRes, fRes] = await Promise.all([
          fetch('/api/testimonials'),
          fetch('/api/faqs'),
        ]);
        if (tRes.ok) {
          const tData = await tRes.json();
          setTestimonials(tData.testimonials || []);
        }
        if (fRes.ok) {
          const fData = await fRes.json();
          setFaqs(fData.faqs || []);
        }
      } catch (err) {
        console.error('Error loading content:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingT(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTestimonial),
      });
      if (res.ok) {
        const data = await res.json();
        setTestimonials((prev) => [...prev, data.testimonial]);
        setNewTestimonial({ authorName: '', designation: 'Head - T&P Cell', collegeName: '', city: '', quote: '', rating: 5 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingT(false);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingF(true);
    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFaq),
      });
      if (res.ok) {
        const data = await res.json();
        setFaqs((prev) => [...prev, data.faq]);
        setNewFaq({ category: 'COLLEGES', question: '', answer: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingF(false);
    }
  };

  return (
    <div className="space-y-12">
      
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Content &amp; Institutional Proof Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage verified TPO testimonials and institutional FAQs.
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
          <span className="text-xs">Loading content items...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left: Testimonials */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Verified TPO Testimonials ({testimonials.length})
              </h2>

              <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
                {testimonials.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{t.authorName} ({t.designation})</span>
                      <span className="text-amber-500 font-bold">{t.rating} ★</span>
                    </div>
                    <div className="text-slate-500">{t.collegeName}, {t.city}</div>
                    <p className="italic text-slate-700 pt-1">&ldquo;{t.quote}&rdquo;</p>
                  </div>
                ))}
              </div>

              {/* Add Testimonial Form */}
              <form onSubmit={handleAddTestimonial} className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                <h3 className="font-bold text-slate-800">Add New Institutional Testimonial</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Author Name"
                    value={newTestimonial.authorName}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, authorName: e.target.value })}
                    className="p-2 rounded-lg border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Role (e.g. Head - T&P)"
                    value={newTestimonial.designation}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, designation: e.target.value })}
                    className="p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="College Name"
                    value={newTestimonial.collegeName}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, collegeName: e.target.value })}
                    className="p-2 rounded-lg border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="City, State"
                    value={newTestimonial.city}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, city: e.target.value })}
                    className="p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="Testimonial quote text..."
                  value={newTestimonial.quote}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                />
                <button
                  type="submit"
                  disabled={savingT}
                  className="w-full py-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  {savingT ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Testimonial
                </button>
              </form>
            </div>
          </div>

          {/* Right: FAQs */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" /> Institutional FAQs ({faqs.length})
              </h2>

              <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
                {faqs.map((f) => (
                  <div key={f.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{f.question}</span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">{f.category}</span>
                    </div>
                    <p className="text-slate-600 pt-1 leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>

              {/* Add FAQ Form */}
              <form onSubmit={handleAddFaq} className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                <h3 className="font-bold text-slate-800">Add New FAQ Item</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newFaq.category}
                    onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                    className="p-2 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="COLLEGES">For Colleges &amp; TPOs</option>
                    <option value="CURRICULUM">Curriculum &amp; Pedagogy</option>
                    <option value="COMMERCIALS">Commercials &amp; Billing</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Question prompt"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    className="p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="Answer explanation..."
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                />
                <button
                  type="submit"
                  disabled={savingF}
                  className="w-full py-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  {savingF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add FAQ
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
