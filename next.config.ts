import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En desarrollo, loguea cada fetch a proveedores con su estado de cache (HIT / MISS / SKIP).
  // Sirve para verificar a ojo que el revalidate funciona y que no se llama a GNews de más.
  logging: { fetches: { fullUrl: false } },
};

export default nextConfig;
