import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  serverExternalPackages: [
    "import-in-the-middle",
    "require-in-the-middle",
    "canvas",
  ],
  webpack: (config, { isServer }) => {
    // Always treat `canvas` as external on the server
    config.externals = [...(config.externals || []), { canvas: "canvas" }];

    if (!isServer) {
      // Use null-loader to stub out any import of `canvas`
      config.module.rules.push({
        test: /canvas/,
        use: "null-loader",
      });
      // Additionally, set fallback to false
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        canvas: false,
      };
    }

    return config;
  },
};

export default nextConfig;
