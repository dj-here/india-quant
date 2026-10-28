'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Heart,
  AlertTriangle,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Phone,
  Shield,
  Dog,
  ExternalLink,
} from 'lucide-react';

interface UpdatePost {
  id: string;
  bookingId: string;
  text: string;
  mediaUrls: string[];
  peeCount: number;
  poopCount: number;
  fedMeal: boolean;
  medsAdministered: boolean;
  createdAt: string;
  sitter: {
    user: {
      name: string;
      image?: string;
    };
  };
}

interface BookingDetails {
  id: string;
  bookingNumber: string;
  status: string;
  startDate: string;
  endDate: string;
  serviceType: string;
  pets: Array<{
    id: string;
    name: string;
    species: string;
    vetName: string;
    vetPhone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  }>;
  sitterName: string;
  isSitter: boolean;
  isOwner: boolean;
}

const SAMPLE_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
];

export default function BookingUpdatesPage({
  params,
}: {
  params: { id: string };
}) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [updates, setUpdates] = useState<UpdatePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for sitter
  const [text, setText] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(SAMPLE_PHOTO_PRESETS[0]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [peeCount, setPeeCount] = useState(1);
  const [poopCount, setPoopCount] = useState(1);
  const [fedMeal, setFedMeal] = useState(true);
  const [medsAdministered, setMedsAdministered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Emergency dialog state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isEmergencySubmitting, setIsEmergencySubmitting] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState<any>(null);

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/bookings/${params.id}/updates`);
      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);
        setUpdates(data.updates || []);
      }
    } catch (err) {
      console.error('Failed to load updates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [params.id]);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const photoToUse = customPhotoUrl.trim() || selectedPhoto;

    try {
      const res = await fetch(`/api/bookings/${params.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          mediaUrls: photoToUse ? [photoToUse] : [],
          peeCount,
          poopCount,
          fedMeal,
          medsAdministered,
        }),
      });

      if (res.ok) {
        setText('');
        setPeeCount(1);
        setPoopCount(1);
        await fetchUpdates();
      } else {
        alert('Failed to post stay update. Please check fields.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while posting update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerEmergency = async () => {
    if (!confirm('Are you sure you want to trigger urgent emergency assistance? This will dispatch alerts to all parties.')) {
      return;
    }

    setIsEmergencySubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Urgent stay assistance requested via updates feed',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEmergencyResult(data);
      } else {
        alert('Failed to trigger emergency dispatch.');
      }
    } catch (err) {
      console.error(err);
      alert('Error contacting emergency support.');
    } finally {
      setIsEmergencySubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
        Loading stay updates...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-600 mb-4">Stay not found.</p>
        <Link href="/search" className="text-emerald-600 font-semibold hover:underline">
          Return to Search
        </Link>
      </div>
    );
  }

  const petNames = booking.pets.map((p) => p.name).join(' & ');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/bookings/${booking.id}`}
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Booking Overview
        </Link>

        {/* Urgent Emergency Button */}
        <button
          onClick={() => setShowEmergencyModal(true)}
          className="inline-flex items-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-full border border-rose-200 transition-colors shadow-sm"
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-600" />
          24/7 Emergency Support
        </button>
      </div>

      {/* Stay Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {booking.serviceType.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400">#{booking.bookingNumber}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Daily Updates for {petNames || 'Pet'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Care provided by <span className="font-semibold text-slate-700">{booking.sitterName}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Dog className="h-4 w-4 text-emerald-600" />
            <span>{booking.pets.length} {booking.pets.length === 1 ? 'Pet' : 'Pets'} on Stay</span>
          </div>
        </div>
      </div>

      {/* Sitter Update Creator (Displayed if current user is the sitter) */}
      {booking.isSitter && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center">
            <Camera className="h-5 w-5 text-emerald-600 mr-2" />
            Post Daily Stay Update
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Pet parents love daily photos, bathroom logs, and reassuring stories!
          </p>

          <form onSubmit={handlePostUpdate} className="space-y-5">
            {/* Activity Tally Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Pee Counter */}
              <div className="text-center">
                <span className="text-xs font-bold text-slate-700 block mb-1.5">💧 Pees</span>
                <div className="inline-flex items-center space-x-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setPeeCount(Math.max(0, peeCount - 1))}
                    className="p-1 text-slate-500 hover:text-slate-800"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-bold text-sm text-slate-900 w-4 text-center">{peeCount}</span>
                  <button
                    type="button"
                    onClick={() => setPeeCount(peeCount + 1)}
                    className="p-1 text-slate-500 hover:text-slate-800"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Poop Counter */}
              <div className="text-center">
                <span className="text-xs font-bold text-slate-700 block mb-1.5">💩 Poops</span>
                <div className="inline-flex items-center space-x-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setPoopCount(Math.max(0, poopCount - 1))}
                    className="p-1 text-slate-500 hover:text-slate-800"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-bold text-sm text-slate-900 w-4 text-center">{poopCount}</span>
                  <button
                    type="button"
                    onClick={() => setPoopCount(poopCount + 1)}
                    className="p-1 text-slate-500 hover:text-slate-800"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Fed Meal Toggle */}
              <div className="text-center flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-700 block mb-1.5">🥣 Fed Meal</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fedMeal}
                    onChange={(e) => setFedMeal(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Meds Given Toggle */}
              <div className="text-center flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-700 block mb-1.5">💊 Meds Given</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={medsAdministered}
                    onChange={(e) => setMedsAdministered(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Photo Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Stay Photo (Select preset or paste URL)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {SAMPLE_PHOTO_PRESETS.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedPhoto(url);
                      setCustomPhotoUrl('');
                    }}
                    className={`relative rounded-lg overflow-hidden h-16 cursor-pointer border-2 transition-all ${
                      selectedPhoto === url && !customPhotoUrl
                        ? 'border-emerald-600 ring-2 ring-emerald-400'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or paste custom photo URL..."
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Journal Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Stay Journal & Story
              </label>
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="How did the pets do today? Any special activities, favorite moments, or routine updates?"
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <span>Posting update...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Send Update to Pet Parent</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Updates Timeline Feed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Stay Activity Timeline</h2>
          <span className="text-xs text-slate-400 font-medium">
            {updates.length} {updates.length === 1 ? 'Update' : 'Updates'}
          </span>
        </div>

        {updates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Camera className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No daily updates yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {booking.isSitter
                ? 'Use the form above to share your first daily card with the pet parent!'
                : 'Your sitter will post photos, bathroom activity, and daily stories here throughout the stay.'}
            </p>
          </div>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              {/* Photo Banner if available */}
              {update.mediaUrls && update.mediaUrls.length > 0 && (
                <div className="w-full h-64 sm:h-80 bg-slate-100 overflow-hidden relative">
                  <img
                    src={update.mediaUrls[0]}
                    alt="Stay update"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
                    📸 Photo by {update.sitter.user.name}
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="p-5">
                {/* Activity Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {typeof update.peeCount === 'number' && update.peeCount > 0 && (
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      💧 {update.peeCount} {update.peeCount === 1 ? 'Pee' : 'Pees'}
                    </span>
                  )}

                  {typeof update.poopCount === 'number' && update.poopCount > 0 && (
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      💩 {update.poopCount} {update.poopCount === 1 ? 'Poop' : 'Poops'}
                    </span>
                  )}

                  {update.fedMeal && (
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      🥣 Fed & Watered
                    </span>
                  )}

                  {update.medsAdministered && (
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                      💊 Meds Administered
                    </span>
                  )}
                </div>

                {/* Narrative Text */}
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {update.text}
                </p>

                {/* Footer with Timestamp */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {new Date(update.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(update.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <span className="text-emerald-600 font-semibold inline-flex items-center">
                    <Shield className="h-3.5 w-3.5 mr-1" /> PawStay Verified Stay
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center space-x-3 mb-4 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">24/7 Urgent Care Assistance</h3>
                <p className="text-xs text-slate-500">PawStay Emergency Response Protocol</p>
              </div>
            </div>

            {emergencyResult ? (
              <div className="space-y-4">
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-900">
                  <span className="font-bold">🚨 Emergency Dispatch Triggered: </span>
                  {emergencyResult.message}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">📞 PawStay Trust & Safety Helpline:</span>
                    <span className="text-base font-extrabold text-emerald-700">{emergencyResult.pawstayHotline}</span>
                  </div>

                  {emergencyResult.emergencyContacts.map((contact: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">Veterinary Info for {contact.petName}:</span>
                      <p className="text-slate-600">Vet: {contact.vetName} ({contact.vetPhone})</p>
                      <p className="text-slate-600">Emergency Contact: {contact.emergencyContactName} ({contact.emergencyContactPhone})</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setShowEmergencyModal(false);
                    setEmergencyResult(null);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Close Emergency Window
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  If your pet requires immediate medical attention or there is an urgent incident during the stay, pressing below will immediately alert PawStay emergency operations, the sitter, and pet emergency contacts.
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-5 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-900">Veterinary Information on File:</p>
                  {booking.pets.map((p) => (
                    <div key={p.id} className="pt-1">
                      • {p.name}: {p.vetName} ({p.vetPhone}) - Emergency: {p.emergencyContactName} ({p.emergencyContactPhone})
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEmergencyModal(false)}
                    className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerEmergency}
                    disabled={isEmergencySubmitting}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                  >
                    {isEmergencySubmitting ? 'Dispatching...' : 'Confirm Dispatch'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
