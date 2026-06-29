/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@supabase/supabase-js',
    '@supabase/postgrest-js',
    '@supabase/realtime-js',
    '@supabase/storage-js',
    '@supabase/functions-js'
  ],
  reactStrictMode: true,
};

export default nextConfig;
