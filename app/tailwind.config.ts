import type { Config } from "tailwindcss";

/**
 * DealFinder — Tailwind theme
 * "Fresh Coast" palette + type scale from DESIGN_SYSTEM.md.
 * A peppy, Going-inspired system: a deep forest green leads, a bright lime is the
 * pop, and a light sky blue gives sections their own color blocks. Components use
 * these named tokens (e.g. bg-primary, text-savings, bg-sky-tint), never raw hex.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — deep forest green (the workhorse: nav, links, primary CTAs)
        primary: {
          DEFAULT: "#0C7048", // --forest-600
          pressed: "#0A5638", // --forest-700
          tint: "#D9F2E4", // --forest-50
        },
        // Accent — bright lime (the pop). Always paired with dark ink text.
        accent: {
          DEFAULT: "#C4ED4E", // --lime-400
          pressed: "#AED93A", // --lime-500
          tint: "#EEF9C9", // --lime-50
        },
        // Sky — light blue; section color blocks + a calm secondary accent
        sky: {
          DEFAULT: "#2FA8E0", // --sky-500
          pressed: "#1E8FC4", // --sky-600
          tint: "#E1F2FC", // --sky-50
        },
        // Urgency — warm amber; expiry / "ending soon" (pops against the greens)
        urgency: {
          DEFAULT: "#F2A52A", // --amber-400
          tint: "#FBEBCD", // --amber-50
        },
        // Danger — warm red; errors, destructive actions, "what we can't see"
        danger: {
          DEFAULT: "#D8472B", // --danger-600
          tint: "#FBE6E0", // --danger-50
        },
        // Savings — money green; $ / % saved
        savings: {
          DEFAULT: "#0B7A4D", // --savings-600
          tint: "#DCF3E7", // --savings-50
        },
        // Text — green-tinted near-black + muted
        ink: {
          DEFAULT: "#16241D", // --ink-900
          muted: "#5C6B62", // --ink-500
        },
        // Surfaces
        surface: "#F3F7F3", // app background (cool off-white)
        card: "#FFFFFF",
        hairline: "#E2EAE3", // --border (cool hairline)
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
