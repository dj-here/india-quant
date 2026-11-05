import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KidsMentor - 1-on-1 AI Tutor for Children',
    short_name: 'KidsMentor',
    description: 'Personal AI tutor for children aged 6 to 16 teaching NCERT STEM and Life Values with real-world family missions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fef3c7',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
