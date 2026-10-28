'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  Search,
  MapPin,
  Calendar,
  Filter,
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  Home,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { formatCentsToDollars } from '@/lib/utils';

function SearchContent() {
  const searchParams = useSearchParams();

  // Search parameters
  const [city, setCity] = useState(searchParams.get('city') || 'Austin, TX');
  const [latitude, setLatitude] = useState(searchParams.get('lat') || '30.2672');
  const [longitude, setLongitude] = useState(searchParams.get('lng') || '-97.7431');
  const [serviceType, setServiceType] = useState(searchParams.get('serviceType') || 'BOARDING');
  const [startDate, setStartDate] = useState(
    searchParams.get('startDate') || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    searchParams.get('endDate') ||
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [petCount, setPetCount] = useState(Number(searchParams.get('petCount') || 1));
  const [fencedYardOnly, setFencedYardOnly] = useState(false);
  const [noOtherPets, setNoOtherPets] = useState(false);
  const [hasMedicationExperience, setHasMedicationExperience] = useState(false);
  const [hasPuppyExperience, setHasPuppyExperience] = useState(false);
  const [instantBookOnly, setInstantBookOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  // Results
  const [sitters, setSitters] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchContext, setSearchContext] = useState<any>(null);

  // Quick metro presets
  const METROS = [
    { name: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
    { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
    { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
    { name: 'New York, NY', lat: 40.7128, lng: -74.006 },
    { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  ];

  const fetchSearchResults = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        serviceType,
        startDate: startDate || '',
        endDate: endDate || '',
        petCount: String(petCount),
        sortBy,
      });

      if (fencedYardOnly) params.append('fencedYardOnly', 'true');
      if (noOtherPets) params.append('noOtherPets', 'true');
      if (hasMedicationExperience) params.append('hasMedicationExperience', 'true');
      if (hasPuppyExperience) params.append('hasPuppyExperience', 'true');
      if (instantBookOnly) params.append('instantBookOnly', 'true');

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSitters(data.sitters || []);
        setTotalCount(data.total || 0);
        setSearchContext(data.searchContext || null);
      }
    } catch (err) {
      console.error('Failed to load search results:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [
    latitude,
    longitude,
    serviceType,
    startDate,
    endDate,
    petCount,
    fencedYardOnly,
    noOtherPets,
    hasMedicationExperience,
    hasPuppyExperience,
    instantBookOnly,
    sortBy,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top Search Controls Bar */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Service Type */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Service
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="BOARDING">Home Boarding</option>
                  <option value="HOUSE_SITTING">House Sitting</option>
                  <option value="DROP_IN">Drop-In Visits</option>
                  <option value="DAY_CARE">Doggy Day Care</option>
                  <option value="WALKING">Dog Walking</option>
                </select>
              </div>

              {/* City Metro Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Metro Location
                </label>
                <select
                  value={city}
                  onChange={(e) => {
                    const selected = METROS.find((m) => m.name === e.target.value);
                    if (selected) {
                      setCity(selected.name);
                      setLatitude(String(selected.lat));
                      setLongitude(String(selected.lng));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {METROS.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Dates
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-1/2 rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-1/2 rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pets Count */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Pets
                </label>
                <select
                  value={petCount}
                  onChange={(e) => setPetCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value={1}>1 Pet</option>
                  <option value={2}>2 Pets</option>
                  <option value={3}>3 Pets</option>
                  <option value={4}>4+ Pets</option>
                </select>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-500 mr-1">Filters:</span>

              <button
                type="button"
                onClick={() => setFencedYardOnly(!fencedYardOnly)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  fencedYardOnly
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Fenced Yard
              </button>

              <button
                type="button"
                onClick={() => setNoOtherPets(!noOtherPets)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  noOtherPets
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                No Other Pets in Home
              </button>

              <button
                type="button"
                onClick={() => setHasMedicationExperience(!hasMedicationExperience)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  hasMedicationExperience
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Medication Experience
              </button>

              <button
                type="button"
                onClick={() => setHasPuppyExperience(!hasPuppyExperience)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  hasPuppyExperience
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Puppy Friendly
              </button>

              <button
                type="button"
                onClick={() => setInstantBookOnly(!instantBookOnly)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  instantBookOnly
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⚡ Instant Book
              </button>
            </div>
          </div>

          {/* Results Header & Sort */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              {isLoading ? (
                'Searching available verified sitters...'
              ) : (
                <>
                  {totalCount} Verified {serviceType.replace('_', ' ').toLowerCase()} hosts in {city}
                </>
              )}
            </h2>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white p-1.5 font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="relevance">Best Match (Bayesian Score)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="distance">Closest Distance</option>
              </select>
            </div>
          </div>

          {/* Sitter Cards List */}
          {isLoading ? (
            <div className="py-20 text-center text-sm text-slate-500">
              Finding the best verified host families for your pets...
            </div>
          ) : sitters.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900">No sitters match all criteria</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try widening your search filters or selecting different dates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sitters.map((sitter) => (
                <div
                  key={sitter.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    {/* Left: Sitter info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-2xl font-black text-white shadow-md shrink-0">
                        {sitter.name.charAt(0)}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{sitter.name}</h3>
                          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            <span>{sitter.rating.toFixed(1)}</span>
                            <span className="text-amber-600 font-normal">({sitter.reviewCount})</span>
                          </div>
                          {sitter.instantBookEnabled && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                              ⚡ Instant Book
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                          {sitter.headline}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {sitter.bio}
                        </p>

                        {/* Location Privacy & Verification Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            Within ~{sitter.approxLocation.approxRadiusMiles} mi of {sitter.city} ({sitter.distanceMiles.toFixed(1)} mi away)
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Identity & Background Verified
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                            <Clock className="h-3.5 w-3.5 text-blue-600" /> Replies ~{sitter.responseTimeMinutes}m
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Itemized Pricing & CTA */}
                    <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 shrink-0 flex flex-col justify-between">
                      <div>
                        <div className="text-2xl font-black text-slate-900">
                          {formatCentsToDollars(sitter.service.baseRateMinor)}
                          <span className="text-xs font-normal text-slate-500 block">per night</span>
                        </div>

                        <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100 text-left sm:text-right">
                          <p className="font-bold text-slate-800">
                            {formatCentsToDollars(sitter.quote.ownerTotalMinor)} all-in total
                          </p>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            {sitter.quote.unitsCount} night{sitter.quote.unitsCount > 1 ? 's' : ''} • {sitter.quote.petCount} pet{sitter.quote.petCount > 1 ? 's' : ''}
                          </p>
                          <p className="text-emerald-700 font-semibold text-[11px] mt-0.5">
                            Includes PawStay guarantee fee
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Link
                          href={`/sitter/${sitter.id}?serviceType=${serviceType}&startDate=${startDate}&endDate=${endDate}&petCount=${petCount}`}
                          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                          View Profile & Book <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-sm font-semibold text-slate-500">Loading verified sitters...</p>
        </div>
      }
    >
      <SearchContent />
    </React.Suspense>
  );
}
