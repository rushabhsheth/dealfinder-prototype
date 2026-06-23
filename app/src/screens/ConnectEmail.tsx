import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, X, Lock, Trash2, Eye, ArrowLeft } from "lucide-react";
import { useDemo } from "../state/DemoContext";
import { useToast } from "../components/Toast";
import { backendEnabled, isSignedIn, startGoogleConnect } from "../lib/api";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Screen 5 — Connect Email. The trust-critical moment: plain-language,
 * read-only framing, explicit "what we can / can't see".
 *
 * Two modes (see lib/api.ts):
 *  - Backend configured → real Google OAuth: we ask the server for the consent
 *    URL (gmail.readonly only) and redirect the browser to Google. Google
 *    returns to /connect/callback.
 *  - Pure-demo (no VITE_API_BASE) → the original mocked handshake that just
 *    advances the flow, so the prototype-style demo still works.
 */
const CAN_SEE = [
  "Promotional & deal emails",
  "Order receipts and confirmations",
  "Travel itineraries and fares",
];
const CANT_SEE = [
  "Personal or work conversations",
  "Anything we don't need for deals",
  "We never send email as you",
];

export default function ConnectEmail() {
  const navigate = useNavigate();
  const connectFlow = (useLocation().state as { connectFlow?: boolean } | null)?.connectFlow;
  const { setInboxConnected } = useDemo();
  const toast = useToast();
  const [connecting, setConnecting] = useState<null | "Gmail" | "Outlook">(null);

  function connectMock(provider: "Gmail" | "Outlook") {
    setConnecting(provider);
    // Mocked OAuth handshake — just a short delay, then continue. Carry the
    // connectFlow flag so enrollment returns to Privacy when reconnecting later.
    setTimeout(() => {
      setInboxConnected(true);
      navigate("/enroll", { state: { connectFlow } });
    }, 1300);
  }

  async function connectGmail() {
    if (!backendEnabled) return connectMock("Gmail");
    // Real OAuth requires a signed-in user; the connect flag survives the detour.
    if (!(await isSignedIn())) {
      navigate("/signin", { state: { next: "/connect", connectFlow } });
      return;
    }
    setConnecting("Gmail");
    try {
      const { authorizeUrl } = await startGoogleConnect();
      // Leave the SPA for Google's consent screen.
      window.location.href = authorizeUrl;
    } catch {
      setConnecting(null);
      toast.show("Couldn't start Google sign-in. Try again.");
    }
  }

  return (
    <div className="pt-2">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-label font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-4 text-h2 font-bold text-ink">Connect inbox</h1>

      <div>
        <div className="flex items-center gap-2 rounded-card bg-primary-tint/60 p-3">
          <Lock size={18} className="shrink-0 text-primary" />
          <p className="text-caption text-ink">
            <span className="font-semibold text-primary-pressed">Read-only.</span> We look for deals
            and nothing else. Disconnect and delete anytime.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Panel tone="see" title="What we can see" items={CAN_SEE} />
          <Panel tone="cant" title="What we can't" items={CANT_SEE} />
        </div>

        <div className="mt-5 flex items-start gap-2 text-caption text-ink-muted">
          <Eye size={15} className="mt-0.5 shrink-0" />
          <p>
            You'll review exactly which senders we scan, and can revoke access from Settings in one
            tap.
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-hairline pt-4">
        {connecting ? (
          <div className="flex h-12 items-center justify-center gap-2 rounded-button bg-primary/10 text-label font-semibold text-primary">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Connecting to {connecting}…
          </div>
        ) : (
          <div className="space-y-2">
            <PrimaryButton onClick={connectGmail}>Connect Gmail</PrimaryButton>
            {backendEnabled ? (
              <button
                disabled
                className="flex h-12 w-full items-center justify-center rounded-button border border-hairline bg-card text-label font-semibold text-ink-muted opacity-60"
              >
                Outlook — coming soon
              </button>
            ) : (
              <button
                onClick={() => connectMock("Outlook")}
                className="flex h-12 w-full items-center justify-center rounded-button border border-hairline bg-card text-label font-semibold text-ink active:bg-surface"
              >
                Connect Outlook
              </button>
            )}
          </div>
        )}
        <p className="mt-2 flex items-center justify-center gap-1.5 text-caption text-ink-muted">
          <Trash2 size={13} /> Delete my data anytime · no questions asked
        </p>
      </div>
    </div>
  );
}

function Panel({
  tone,
  title,
  items,
}: {
  tone: "see" | "cant";
  title: string;
  items: string[];
}) {
  const isSee = tone === "see";
  return (
    <div className="rounded-card border border-hairline bg-card p-3.5 shadow-card">
      <p className="text-label font-semibold text-ink">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-1.5 text-caption text-ink-muted">
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                isSee ? "bg-savings-tint text-savings" : "bg-[#F2E2DA] text-accent-pressed"
              }`}
            >
              {isSee ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
            </span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
