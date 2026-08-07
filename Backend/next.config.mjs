/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["knex", "mysql2"],
    instrumentationHook: true,
  },
};

export default nextConfig;
