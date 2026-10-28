'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, UserCheck, LayoutDashboard, Search, PlusCircle, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    roles?: string[];
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const isAdmin = user?.roles?.includes('ADMIN');
  const isSitter = user?.roles?.includes('SITTER');

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl shadow-md">
              🐾
            </span>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Paw<span className="text-emerald-600">Stay</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/search"
              className={`text-sm font-semibold transition ${
                pathname.startsWith('/search') ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Find a Sitter
            </Link>
            <Link
              href="/sitter/apply"
              className={`text-sm font-semibold transition ${
                pathname.startsWith('/sitter/apply') ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Become a Sitter
            </Link>
            <Link
              href="/messages"
              className={`text-sm font-semibold transition ${
                pathname.startsWith('/messages') ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Messages
            </Link>
            {isSitter && (
              <Link
                href="/sitter/dashboard"
                className={`text-sm font-semibold transition ${
                  pathname.startsWith('/sitter/dashboard') ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                Sitter Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin/sitters"
                className={`inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white transition hover:bg-slate-800 ${
                  pathname.startsWith('/admin') ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Admin Ops
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/pets"
                className="hidden sm:inline-flex text-sm font-medium text-slate-700 hover:text-emerald-600"
              >
                My Pets
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                <div className="h-7 w-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
