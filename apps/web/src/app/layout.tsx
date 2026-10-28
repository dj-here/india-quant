import type { Metadata } from 'next';
import './globals.css';

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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
