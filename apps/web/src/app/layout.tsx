import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://campusedge.in'),
  title: {
    default: 'CampusEdge | Institutional Technical Finishing School & Placement Acceleration',
    template: '%s | CampusEdge Learning Solutions',
  },
  description:
    'Company-standard training in Data Structures & Algorithms (Java/Python/C++), Speed Quantitative Aptitude, and Corporate Soft Skills for engineering colleges across India. Mapped to NAAC 5.1.3 and NBA Criterion 4.',
  keywords: [
    'campus placement training',
    'TPO college training',
    'DSA training for engineering colleges',
    'quantitative aptitude training',
    'NAAC Criterion 5.1.3 capacity building',
    'NBA Criterion 4 student performance',
    'technical finishing school India',
    'TCS NQT preparation',
    'Cognizant GenC training',
  ],
  authors: [{ name: 'CampusEdge Learning Solutions', url: 'https://campusedge.in' }],
  creator: 'CampusEdge EdTech Private Limited',
  publisher: 'CampusEdge Learning Solutions',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://campusedge.in',
    siteName: 'CampusEdge Learning Solutions',
    title: 'CampusEdge | Institutional Placement Acceleration & Technical Finishing School',
    description:
      'Empowering engineering colleges to achieve 70%+ Day-1 placement clearances. Ex-FAANG led DSA, Aptitude, and Soft Skills training.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CampusEdge Institutional Placement Training',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampusEdge | Institutional Placement Acceleration',
    description: 'Transforming college campus placements into industry-grade career launches.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'CampusEdge Learning Solutions',
    alternateName: 'CampusEdge EdTech Private Limited',
    url: 'https://campusedge.in',
    logo: 'https://campusedge.in/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9820144550',
      contactType: 'Institutional Partnerships',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'Karnataka',
      addressLocality: 'Bengaluru',
    },
  };

  const jsonLdCourse = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Placement-Ready Technical Accelerator',
    description:
      'Comprehensive 200-hour institutional training in Data Structures & Algorithms, Speed Aptitude, and 1-on-1 Mock Technical Interviews.',
    provider: {
      '@type': 'Organization',
      name: 'CampusEdge Learning Solutions',
      sameAs: 'https://campusedge.in',
    },
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCourse) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans selection:bg-sky-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
