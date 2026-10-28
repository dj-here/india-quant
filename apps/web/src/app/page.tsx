import Link from 'next/link';
import { ShieldCheck, DollarSign, HeartHandshake, Search, Calendar, MapPin, Award } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl shadow-md">
              🐾
            </span>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Paw<span className="text-emerald-600">Stay</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/search"
              className="text-sm font-semibold text-slate-700 hover:text-emerald-600 transition"
            >
              Find a Sitter
            </Link>
            <Link
              href="/sitter/apply"
              className="hidden sm:inline-block text-sm font-semibold text-slate-700 hover:text-emerald-600 transition"
            >
              Become a Sitter
            </Link>
            <Link
              href="/auth/signin"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 mb-6">
                <Award className="h-4 w-4" /> 100% Identity & Background-Checked Sitters
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl">
                Personalized pet care that feels like{' '}
                <span className="text-emerald-600">home</span>.
              </h1>
              <p className="mt-6 text-lg text-slate-600">
                Skip stressful kennels. Connect with vetted, loving host families for boarding,
                house sitting, dog walking, and day care with daily photo updates and all-in transparent pricing.
              </p>
            </div>

            {/* Quick Search Widget */}
            <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6">
              <form action="/search" method="GET" className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1">Service</label>
                  <select
                    name="serviceType"
                    defaultValue="BOARDING"
                    className="rounded-lg border border-slate-300 p-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="BOARDING">Home Boarding</option>
                    <option value="HOUSE_SITTING">House Sitting</option>
                    <option value="DROP_IN">Drop-in Visits</option>
                    <option value="DAY_CARE">Doggy Day Care</option>
                    <option value="WALKING">Dog Walking</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1">City or Locality</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="location"
                      placeholder="e.g. Bengaluru, KA"
                      defaultValue="Bengaluru, KA"
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm font-medium focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1">Dates</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Dates"
                      defaultValue="Upcoming Weekend"
                      readOnly
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm font-medium bg-slate-50 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-700 transition"
                  >
                    <Search className="h-4 w-4" />
                    Search Sitters
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* 3 Pillars: Trust, Cost Transparency, Care Quality */}
        <section className="py-16 sm:py-20 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Why Pet Parents Choose PawStay
              </h2>
              <p className="mt-3 text-slate-600">
                Every policy and feature is engineered to give your pet family safety and peace of mind.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/50 hover:shadow-md transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Uncompromising Trust</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Every sitter passes a government ID check and nationwide criminal background check before being listed.
                  Addresses stay private until bookings are confirmed.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/50 hover:shadow-md transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 mb-4">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Total Cost Transparency</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  No hidden checkout surprises. See all-in pricing with our live Kennel Cost Comparison widget
                  to compare real savings versus traditional commercial kennels.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/50 hover:shadow-md transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 mb-4">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Top-Tier Care Quality</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Structured pet health profiles, feeding and medication schedules, daily photo updates,
                  and 24/7 emergency support backing every confirmed stay.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>© {new Date().getFullYear()} PawStay Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/safety" className="hover:text-white transition">Trust & Safety</Link>
            <Link href="/cancellation" className="hover:text-white transition">Cancellation Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
