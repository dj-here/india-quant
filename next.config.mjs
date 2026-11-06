/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Phaser manages its own canvas lifecycle; strict mode double mount can cause duplicate canvases
  swcMinify: true,
  webpack: (config) => {
    // Support loading raw canvas audio or assets if needed
    config.externals = [...(config.externals || [])];
    return config;
  },
};

export default nextConfig;
