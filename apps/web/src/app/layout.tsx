import type { Metadata } from 'next';
import './globals.css';
import { CookieBanner } from '@/components/CookieBanner';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'PawStay | Trusted, Loving Pet Care & Home Boarding',
  description:
    'Book vetted, verified sitters and host families for home boarding, house sitting, drop-in visits, day care, and dog walking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col justify-between">
        <main className="flex-1">{children}</main>

        {/* Global SEO Footer with Legal Links */}
        <footer className="bg-white border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8 mt-16 text-xs text-slate-500">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base text-slate-900 tracking-tight">
                Paw<span className="text-emerald-600">Stay</span>
              </span>
              <span className="text-slate-300">|</span>
              <span>© {new Date().getFullYear()} PawStay Technologies, Inc.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
              <Link href="/services/boarding/austin" className="hover:text-emerald-600">
                Austin Dog Boarding
              </Link>
              <Link href="/services/boarding/seattle" className="hover:text-emerald-600">
                Seattle Dog Boarding
              </Link>
              <Link href="/safety" className="hover:text-emerald-600">
                PawStay Guarantee
              </Link>
              <Link href="/cancellation-policy" className="hover:text-emerald-600">
                Cancellation Policy
              </Link>
              <Link href="/terms" className="hover:text-emerald-600">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-emerald-600">
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>

        <CookieBanner />
      </body>
    </html>
  );
}
