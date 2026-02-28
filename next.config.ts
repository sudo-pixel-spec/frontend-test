import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ hostnames only (no http://, no port)
  allowedDevOrigins: ["localhost", "192.168.100.12"],
};

export default nextConfig;