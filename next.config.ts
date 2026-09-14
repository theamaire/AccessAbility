import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.254.105"],
    images: {
    domains: ["rvocpntyjcskssrbcoic.supabase.co"],
    unoptimized: true,
  },
 
};

export default nextConfig;
