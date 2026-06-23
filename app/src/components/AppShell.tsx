import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useDemo } from "../state/DemoContext";
import { gateFor } from "../lib/featureGates";
import TopNav from "./TopNav";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import HeaderMenu from "./HeaderMenu";
import AgentButton from "./AgentButton";
import Wordmark from "./Wordmark";
import AppRedirectInterstitial from "./AppRedirectInterstitial";

/**
 * AppShell — the single responsive shell that replaces the global PhoneFrame
 * (RESPONSIVE_WEB_PRD.md §6). One layout route, four presentations:
 *   • desktop/tablet (md+): sticky TopNav + centered max-width content + Footer
 *   • mobile (<md): compact app bar + flowing content + fixed BottomNav + Footer
 * It owns all chrome and the scroll model so screens render pure content. The
 * presentation is chosen by route "variant"; auth state comes from DemoContext.
 */

// Onboarding / auth / conversion: centered card on desktop, full-screen on mobile.
const FORM_ROUTES = [
  "/intro",
  "/trial",
  "/connect",
  "/signin",
  "/auth",
  "/enroll",
  "/scan",
  "/summary",
  "/paywall",
  "/subscribed",
];

// Surfaces that require a session; anonymous users are routed to sign-in.
const SIGNED_IN_ONLY = [
  "/watches",
  "/savings",
  "/brands",
  "/chat",
  "/settings",
  "/privacy",
  "/scan",
  "/enroll",
  "/summary",
];

type Variant = "marketing" | "form" | "app";

function variantFor(pathname: string): Variant {
  if (pathname === "/") return "marketing";
  if (FORM_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "form";
  return "app";
}

export default function AppShell() {
  const { pathname } = useLocation();
  const { signedIn } = useDemo();
  const variant = variantFor(pathname);
  const gate = gateFor(pathname);

  // Anonymous guard: gated surfaces bounce to sign-in (and back, in real auth).
  if (!signedIn && SIGNED_IN_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return <Navigate to="/signin" replace />;
  }

  const content =
    gate === "app-redirect" ? (
      <AppRedirectInterstitial surface={pathname.split("/").filter(Boolean)[0] ?? ""} />
    ) : (
      <Outlet />
    );

  if (variant === "form") {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-surface">
        <header className="flex h-14 shrink-0 items-center px-4 md:h-16 md:px-6">
          <Wordmark to={signedIn ? "/feed" : "/"} />
        </header>
        <main className="flex flex-1 flex-col px-4 pb-10 md:items-center md:justify-center md:px-6">
          <div className="w-full md:max-w-md">{content}</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (variant === "marketing") {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-surface">
        <TopNav />
        <MobileBar />
        <main className="flex-1">{content}</main>
        <Footer />
      </div>
    );
  }

  // App variant
  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface pb-16 md:pb-0">
      <TopNav />
      <MobileBar />
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-4 md:px-6 md:py-6 lg:px-8">
        {content}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

/** Mobile-only top app bar (md:hidden): drawer · wordmark · Scout. */
function MobileBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-surface/90 px-2 backdrop-blur md:hidden">
      <HeaderMenu />
      <Wordmark size="sm" />
      <AgentButton />
    </header>
  );
}
