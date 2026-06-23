import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useDemo } from "../state/DemoContext";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Landing screen after Google's OAuth redirect. The server has already exchanged
 * the code and stored the (encrypted) tokens; it bounces the browser here with
 * ?status=success | error. On success we mark the inbox connected and continue
 * the flow; on error we explain plainly and offer retry — no silent failure.
 */
const REASONS: Record<string, string> = {
  scope_denied: "We need read-only access to find deals. Please allow it to continue.",
  bad_state: "That sign-in link expired. Please try connecting again.",
  missing_code: "Google didn't complete the connection. Please try again.",
  access_denied: "You declined access. You can connect whenever you're ready.",
  connect_failed: "We couldn't finish connecting. Please try again.",
};

export default function ConnectCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setInboxConnected } = useDemo();
  const status = params.get("status");
  const reason = params.get("reason");
  const [done, setDone] = useState(false);

  const success = status === "success";

  useEffect(() => {
    if (success) {
      setInboxConnected(true);
      const t = setTimeout(() => {
        navigate("/enroll", { replace: true });
      }, 1100);
      return () => clearTimeout(t);
    }
    setDone(true);
  }, [success, setInboxConnected, navigate]);

  return (
    <div className="py-10">
      <div className="flex flex-col items-center text-center">
        {success ? (
          <>
            <CheckCircle2 size={48} className="text-savings" />
            <p className="mt-4 text-h3 font-semibold text-ink">Gmail connected</p>
            <p className="mt-1.5 text-label text-ink-muted">
              Read-only. Setting up your deals…
            </p>
          </>
        ) : done ? (
          <>
            <AlertCircle size={48} className="text-accent-pressed" />
            <p className="mt-4 text-h3 font-semibold text-ink">Couldn't connect</p>
            <p className="mt-1.5 text-label text-ink-muted">
              {(reason && REASONS[reason]) ?? REASONS.connect_failed}
            </p>
            <div className="mt-6 w-full max-w-xs">
              <PrimaryButton onClick={() => navigate("/connect", { replace: true })}>
                Try again
              </PrimaryButton>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
