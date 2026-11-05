import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'KidsMentor | Personal 1-on-1 AI Tutor for Children (Ages 6-16)',
  description: 'AI is the ONLY instructor: Socratic tutoring in NCERT Maths & Science, plus Flagship Life Values & Ethics. Fully safe, honest AI identity, and DPDP Act 2023 compliant.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-amber-50/20 text-slate-800 antialiased selection:bg-amber-200">
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
