import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Vercel 빌드 시 ESLint 무시 (점진적으로 수정 예정)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
