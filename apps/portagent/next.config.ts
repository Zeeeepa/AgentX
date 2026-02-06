import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@agentxjs/server",
    "@agentxjs/node-platform",
    "@agentxjs/mono-driver",
    "@agentxjs/core",
    "commonxjs",
    "ws",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Node.js-only packages used by agentxjs in local mode (dynamic imports,
      // never executed in browser). Tell webpack to provide empty modules.
      config.resolve.alias = {
        ...config.resolve.alias,
        "@agentxjs/node-platform": false,
        "@agentxjs/mono-driver": false,
        ws: false,
      };
    }
    return config;
  },
};

export default nextConfig;
