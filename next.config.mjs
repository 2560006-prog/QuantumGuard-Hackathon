const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: { missingSuspenseWithCSRBailout: false },
  images: { domains: ['wxbeejdqizefwticuqqo.supabase.co'] },
  swcMinify: true,
};
export default nextConfig;