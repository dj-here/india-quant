import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import { Navbar } from '@/components/Navbar';
import {
  Heart,
  PlusCircle,
  FileCheck,
  Phone,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';

export default async function PetsListPage() {
  const session = await getServerSession(authOptions);

  let ownerId = session?.user?.id;
  if (!ownerId) {
    const firstOwner = await prisma.user.findFirst({
      where: { roles: { has: 'OWNER' } },
      select: { id: true },
    });
    ownerId = firstOwner?.id;
  }

  const pets = ownerId
    ? await prisma.pet.findMany({
        where: { ownerId, isArchived: false },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session?.user} />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
                <Heart className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" /> My PawStay Pet Family
              </div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Pet Care Profiles</h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Detailed care routines, feeding schedules, veterinarian contacts, and vaccination records.
              </p>
            </div>

            <Link
              href="/pets/new"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
            >
              <PlusCircle className="h-4 w-4" /> Add New Pet
            </Link>
          </div>

          {/* Pets Grid */}
          {pets.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Heart className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No Pets Added Yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
                Add your dog or cat profile before booking so sitters have their exact feeding instructions and emergency vet information.
              </p>
              <Link
                href="/pets/new"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <PlusCircle className="h-4 w-4" /> Add Pet Profile
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Pet Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-16 w-16 rounded-2xl bg-slate-900 text-white font-bold text-2xl flex items-center justify-center shrink-0">
                        {pet.species === 'DOG' ? '🐕' : '🐈'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{pet.name}</h3>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                            {pet.species}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {pet.breed} • {pet.ageYears} yrs • {pet.weightLbs} lbs
                        </p>
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {pet.isSpayedNeutered ? '✓ Spayed / Neutered' : 'Not spayed/neutered'}
                        </p>
                      </div>
                    </div>

                    {/* Feeding & Health Instructions */}
                    <div className="space-y-2.5 border-t border-slate-100 pt-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 block">Feeding Schedule:</span>
                        <p className="text-slate-600 bg-slate-50 p-2 rounded-lg mt-0.5">
                          {pet.feedingSchedule}
                        </p>
                      </div>

                      {pet.medications && (
                        <div>
                          <span className="font-bold text-amber-800 flex items-center gap-1">
                            <Info className="h-3 w-3 text-amber-600" /> Medications:
                          </span>
                          <p className="text-slate-600 bg-amber-50/50 p-2 rounded-lg mt-0.5 border border-amber-100">
                            {pet.medications}
                          </p>
                        </div>
                      )}

                      {pet.allergies && (
                        <div>
                          <span className="font-bold text-rose-800">Allergies:</span>
                          <p className="text-slate-600">{pet.allergies}</p>
                        </div>
                      )}

                      {/* Temperament Tags */}
                      {pet.temperamentFlags.length > 0 && (
                        <div className="pt-1">
                          <span className="font-bold text-slate-700 block mb-1">Temperament:</span>
                          <div className="flex flex-wrap gap-1">
                            {pet.temperamentFlags.map((flag, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vet & Emergency Details */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mt-3 space-y-1">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-bold">Veterinarian:</span>
                          <span>{pet.vetName}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Vet Phone:</span>
                          <span className="font-mono">{pet.vetPhone}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px] border-t border-slate-200 pt-1 mt-1">
                          <span>Emergency Contact:</span>
                          <span>{pet.emergencyContactName} ({pet.emergencyContactPhone})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <FileCheck className="h-3.5 w-3.5" /> Vaccinations Uploaded
                    </span>
                    <span className="font-bold text-slate-400 hover:text-slate-800 cursor-pointer">
                      Edit Profile
                    </span>
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
