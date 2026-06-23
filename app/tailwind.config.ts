import type { Config } from "tailwindcss";

/**
 * DealFinder — Tailwind theme
 * "Sunset Tide" palette + type scale from DESIGN_SYSTEM.md.
 * Components should use these named tokens (e.g. bg-primary, text-savings),
 * never raw hex values.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — deep teal (the sea)
        primary: {
          DEFAULT: "#0E8C8A", // --teal-600
          pressed: "#0B6F6D", // --teal-700
          tint: "#D2ECE7", // --teal-50
        },
        // Accent — apricot (the setting sun); spotlight CTAs only
        accent: {
          DEFAULT: "#F5945C", // --apricot-500
          pressed: "#E07A40", // --apricot-700
          tint: "#FBE4CC", // --apricot-50
        },
        // Urgency — golden amber; expiry / "ending soon"
        urgency: {
          DEFAULT: "#ECC14E", // --amber-400
          tint: "#FBE4CC", // --amber-50
        },
        // Savings — deep teal-green; $ / % saved
        savings: {
          DEFAULT: "#0B6B60", // --savings-600
          tint: "#D2ECE7", // --savings-50
        },
        // Text — warm near-black + muted
        ink: {
          DEFAULT: "#27302E", // --ink-900
          muted: "#7A6E5E", // --ink-500
        },
        // Surfaces
        surface: "#F6EDDC", // app background (warm sand)
        card: "#FFFFFF",
        hairline: "#E7D9C2", // --border
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // [size, { lineHeight, fontWeight }] — from DESIGN_SYSTEM.md type scale
        display: ["28px", { lineHeight: "32px", fontWeight: "700" }],
        h1: ["22px", { lineHeight: "28px", fontWeight: "700" }],
        h2: ["18px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["15px", { lineHeight: "22px", fontWeight: "400" }],
        caption: ["13px", { lineHeight: "18px", fontWeight: "400" }],
        label: ["13px", { lineHeight: "16px", fontWeight: "600" }],
      },
      borderRadius: {
        card: "16px",
        button: "14px",
        badge: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(39, 48, 46, 0.06)",
      },
      fontVariantNumeric: {
        tabular: "tabular-nums", // prices/savings align
      },
      maxWidth: {
        phone: "390px", // mobile-first viewport
        content: "1200px", // centered desktop content container
      },
    },
  },
  plugins: [],
};

export default config;
