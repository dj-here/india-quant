'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileBadge,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export default function NewPetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('Charlie');
  const [species, setSpecies] = useState<'DOG' | 'CAT'>('DOG');
  const [breed, setBreed] = useState('Golden Retriever');
  const [ageYears, setAgeYears] = useState(3);
  const [weightLbs, setWeightLbs] = useState(65);
  const [isSpayedNeutered, setIsSpayedNeutered] = useState(true);
  const [feedingSchedule, setFeedingSchedule] = useState(
    '2 cups of kibble at 8:00 AM and 6:00 PM. Always fresh water in bowl.'
  );
  const [medications, setMedications] = useState('Heartworm chewable tablet on the 1st of every month.');
  const [allergies, setAllergies] = useState('Chicken protein sensitivity (eats salmon formula)');
  const [microchipId, setMicrochipId] = useState('985141002948211');

  // Vet details
  const [vetName, setVetName] = useState('Dr. Sarah Jenkins, DVM');
  const [vetPhone, setVetPhone] = useState('512-555-0199');
  const [vetClinic, setVetClinic] = useState('Austin Central Animal Hospital');

  // Emergency contact
  const [emergencyContactName, setEmergencyContactName] = useState('Michael Chen (Brother)');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('512-555-0144');

  // Temperament flags
  const [selectedFlags, setSelectedFlags] = useState<string[]>([
    'Friendly with other dogs',
    'Great with children',
    'House trained',
    'Moderate energy',
  ]);

  const AVAILABLE_FLAGS = [
    'Friendly with other dogs',
    'Friendly with cats',
    'Great with children',
    'House trained',
    'High energy',
    'Moderate energy',
    'Couch potato / Low energy',
    'Mild leash reactivity',
    'Resource guarding / separate feeding needed',
    'Separation anxiety',
    'Thunder / noise sensitivity',
  ];

  const toggleFlag = (flag: string) => {
    if (selectedFlags.includes(flag)) {
      setSelectedFlags(selectedFlags.filter((f) => f !== flag));
    } else {
      setSelectedFlags([...selectedFlags, flag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        name,
        species,
        breed,
        ageYears: Number(ageYears),
        weightLbs: Number(weightLbs),
        isSpayedNeutered,
        temperamentFlags: selectedFlags,
        medications,
        feedingSchedule,
        allergies,
        microchipId,
        vetName,
        vetPhone,
        vetClinic,
        emergencyContactName,
        emergencyContactPhone,
        vaccinationDocumentUrls: [
          'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
        ],
      };

      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save pet profile');
      }

      router.push('/pets');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating pet profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Add Pet Profile</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure your pet receives the highest care standard by providing detailed instructions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                1. Basic Pet Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Species *
                  </label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="DOG">Dog</option>
                    <option value="CAT">Cat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Breed *
                  </label>
                  <input
                    type="text"
                    required
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={30}
                      value={ageYears}
                      onChange={(e) => setAgeYears(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Weight (lbs) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={250}
                      value={weightLbs}
                      onChange={(e) => setWeightLbs(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isSpayedNeutered}
                    onChange={(e) => setIsSpayedNeutered(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Spayed or Neutered
                </label>
              </div>
            </div>

            {/* Feeding & Medical */}
            <div className="space-y-4 pt-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                2. Feeding & Health Routines
              </h2>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Feeding Schedule & Portions *
                </label>
                <textarea
                  rows={2}
                  required
                  value={feedingSchedule}
                  onChange={(e) => setFeedingSchedule(e.target.value)}
                  placeholder="e.g. 1 cup morning at 8am, 1 cup evening at 6pm. Wet food on weekends."
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Medications (Optional)
                  </label>
                  <input
                    type="text"
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="e.g. Monthly heartworm pill, ear drops"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Allergies or Restrictions (Optional)
                  </label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Chicken allergy, sensitive stomach"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Temperament */}
            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                3. Behavior & Temperament Flags
              </h2>
              <p className="text-xs text-slate-500">
                Accurate temperament tags help hosts create a safe, stress-free environment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_FLAGS.map((flag) => (
                  <label
                    key={flag}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer transition ${
                      selectedFlags.includes(flag)
                        ? 'border-emerald-600 bg-emerald-50/50 font-semibold text-emerald-950'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFlags.includes(flag)}
                      onChange={() => toggleFlag(flag)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{flag}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Veterinary & Emergency Contacts */}
            <div className="space-y-4 pt-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                4. Primary Veterinarian & Emergency Contacts
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Vet Name / Doctor *
                  </label>
                  <input
                    type="text"
                    required
                    value={vetName}
                    onChange={(e) => setVetName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Vet Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={vetPhone}
                    onChange={(e) => setVetPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    value={vetClinic}
                    onChange={(e) => setVetClinic(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Saving Profile...' : 'Save Pet Profile'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
