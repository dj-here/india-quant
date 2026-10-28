import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://pawstay.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/messages/', '/book/checkout'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
