// @ts-check
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

const site = process.env.VERCEL
  ? process.env.VERCEL_ENV === "production"
    ? "https://sywyke.vercel.app"
    : `https://${process.env.VERCEL_URL}`
  : (process.env.SITE ?? "http://localhost:4321");
const base = process.env.base || "/";

export default defineConfig({
  site,
  base,
  integrations: [react()],
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Geist",
        cssVariable: "--font-geist",
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
