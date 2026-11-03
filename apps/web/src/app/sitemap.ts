import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://campusedge.in';
  const currentDate = new Date();

  const routes = [
    { url: `${baseUrl}`, lastModified: currentDate, changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/programs`, lastModified: currentDate, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/packages`, lastModified: currentDate, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/how-it-works`, lastModified: currentDate, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/assessment`, lastModified: currentDate, changeFrequency: 'weekly' as const, priority: 0.95 },
    { url: `${baseUrl}/demo`, lastModified: currentDate, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: currentDate, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: currentDate, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: currentDate, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: currentDate, changeFrequency: 'yearly' as const, priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: 'yearly' as const, priority: 0.5 },
  ];

  return routes;
}
