import type { NextConfig } from "next";

const isTauriBuild = process.env.TAURI_BUILD === "true" || !!process.env.TAURI_ENV_ARCH;

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: isTauriBuild ? "out" : ".next",
};

export default nextConfig;
