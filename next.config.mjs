/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: true,
      },
      {
        source: "/projects",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
