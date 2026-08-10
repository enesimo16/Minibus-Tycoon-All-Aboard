import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  // `shared/economy.json` frontend klasörünün dışında; Turbopack workspace root'u
  // repo kökü olmalı ki ortak ekonomi dosyası dev server'da da çözülebilsin.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
