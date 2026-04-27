import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Wagmi/RainbowKit pulls some Node-only deps. Mark these external in server build.
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],
};

export default nextConfig;
