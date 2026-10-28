'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  Heart,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ReviewData {
  id: string;
  rating: number;
  title?: string;
  content: string;
  cleanlinessRating?: number;
  communicationRating?: number;
  timelinessRating?: number;
  careQualityRating?: number;
  isRecommended: boolean;
  isBlind: boolean;
  revealedAt?: string;
  createdAt: string;
}

export default function BookingReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [myReview, setMyReview] = useState<ReviewData | null>(null);
  const [counterpartyReview, setCounterpartyReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form inputs
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [careQualityRating, setCareQualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [timelinessRating, setTimelinessRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [isRecommended, setIsRecommended] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch(`/api/bookings/${params.id}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data.booking);
          setMyReview(data.myReview);
          setCounterpartyReview(data.counterpartyReview);
        }
      } catch (err) {
        console.error('Failed to load review data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReviews();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          title: title.trim() || null,
          content: content.trim(),
          careQualityRating,
          communicationRating,
          timelinessRating,
          cleanlinessRating,
          isRecommended,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMyReview(data.review);
        setSuccessMessage(data.message);
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return 'Exceptional (5/5)';
      case 4:
        return 'Very Good (4/5)';
      case 3:
        return 'Average (3/5)';
      case 2:
        return 'Below Expectations (2/5)';
      case 1:
        return 'Poor (1/5)';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
        Loading review status...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-600 mb-4">Stay not found.</p>
        <Link href="/search" className="text-emerald-600 font-semibold hover:underline">
          Return to Search
        </Link>
      </div>
    );
  }

  const otherPersonName = booking.isOwner ? booking.sitterName : booking.ownerName;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href={`/bookings/${booking.id}`}
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Booking Overview
        </Link>
      </div>

      {/* Double-Blind Protection Shield Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-start space-x-3 text-xs text-emerald-950">
        <Shield className="h-5 w-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold text-sm block mb-0.5 text-emerald-900">
            🔒 Double-Blind Review System
          </span>
          To guarantee complete honesty and eliminate bias, reviews remain strictly confidential.
          Neither party can view the other&apos;s feedback until both submit, or after 14 days.
        </div>
      </div>

      {/* If already submitted review */}
      {myReview ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center space-x-3 text-emerald-700 mb-4">
            <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Review Submitted!</h2>
              <p className="text-xs text-slate-500">Thank you for helping build our trusted pet care community.</p>
            </div>
          </div>

          {/* Blindness Status Pill */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {myReview.isBlind ? (
                <>
                  <Lock className="h-4 w-4 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Status: Confidential (Blind)</span>
                    <span className="text-[11px] text-slate-500">
                      {counterpartyReview?.submitted
                        ? 'Counterparty has submitted! Reviews will unlock shortly.'
                        : `Awaiting ${otherPersonName}'s review or 14-day expiry.`}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Status: Public & Revealed</span>
                    <span className="text-[11px] text-slate-500">
                      Both reviews are published and visible on sitter profile.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Your Submitted Content Preview */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center space-x-1 text-amber-400 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < myReview.rating ? 'fill-current' : 'text-slate-300'}`}
                />
              ))}
              <span className="text-xs font-bold text-slate-700 ml-2">{myReview.rating}.0</span>
            </div>

            {myReview.title && (
              <h3 className="font-bold text-slate-900 text-sm mb-1">{myReview.title}</h3>
            )}
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{myReview.content}</p>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href={`/bookings/${booking.id}`}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition"
            >
              Return to Stay Overview
            </Link>
          </div>
        </div>
      ) : (
        /* Review Submission Form */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <span className="text-xs font-extrabold uppercase text-emerald-700 tracking-wider">
              Feedback for Booking #{booking.bookingNumber}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              How was your experience with {otherPersonName}?
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Your feedback is double-blind and directly supports care standards.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primary Star Rating */}
            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Overall Rating
              </label>
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-2 block">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>

            {/* Sub-Category Ratings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  🐾 Care Quality
                </label>
                <select
                  value={careQualityRating}
                  onChange={(e) => setCareQualityRating(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Average</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Very Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  💬 Communication
                </label>
                <select
                  value={communicationRating}
                  onChange={(e) => setCommunicationRating(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={5}>5 - Responsive & Clear</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Acceptable</option>
                  <option value={2}>2 - Slow</option>
                  <option value={1}>1 - Unresponsive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ⏱️ Timeliness & Reliability
                </label>
                <select
                  value={timelinessRating}
                  onChange={(e) => setTimelinessRating(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={5}>5 - Right on schedule</option>
                  <option value={4}>4 - Reliable</option>
                  <option value={3}>3 - Minor delays</option>
                  <option value={2}>2 - Often late</option>
                  <option value={1}>1 - Very late</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ✨ Cleanliness & Environment
                </label>
                <select
                  value={cleanlinessRating}
                  onChange={(e) => setCleanlinessRating(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={5}>5 - Spotless</option>
                  <option value={4}>4 - Clean & tidy</option>
                  <option value={3}>3 - Standard</option>
                  <option value={2}>2 - Needs improvement</option>
                  <option value={1}>1 - Unsanitary</option>
                </select>
              </div>
            </div>

            {/* Recommendation Checkbox */}
            <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="recommendCheck"
                checked={isRecommended}
                onChange={(e) => setIsRecommended(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <label htmlFor="recommendCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                I recommend <span className="font-bold text-slate-900">{otherPersonName}</span> to other pet parents
              </label>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Headline / Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Luna had the best time, will definitely book again!"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Narrative Feedback */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Detailed Review Feedback
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share details about the stay, pet behavior, routine updates, and communication..."
                className="w-full border border-slate-300 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              <Lock className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving Review...' : 'Submit Confidential Review'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
