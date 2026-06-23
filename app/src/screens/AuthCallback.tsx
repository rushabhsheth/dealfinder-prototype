import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { takeAuthNext } from "../lib/api";
import { useDemo } from "../state/DemoContext";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Landing screen after "Continue with Google". Supabase (detectSessionInUrl)
 * exchanges the code on load; once a session exists we continue to wherever the
 * user was headed (saved before the redirect), defaulting to the feed. Errors
 * surface plainly with a retry — never a silent hang.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { syncFromServer } = useDemo();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      navigate("/signin", { replace: true });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setError(params.get("error_description") ?? params.get("error"));
      return;
    }

    let done = false;
    const proceed = async () => {
      if (done) return;
      done = true;
      // Returning users (already have a connected inbox) skip the connect+scan
      // onboarding and land on their feed; everyone else continues where they
      // were headed (e.g. a new user mid-connect).
      const next = takeAuthNext();
      const { connected } = await syncFromServer();
      navigate(connected ? "/feed" : (next ?? "/feed"), { replace: true });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) proceed();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) proceed();
    });
    const timer = setTimeout(() => {
      if (!done) setError("Sign-in timed out. Please try again.");
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate, syncFromServer]);

  return (
    <div className="py-10">
      <div className="flex flex-col items-center text-center">
        {error ? (
          <>
            <AlertCircle size={48} className="text-danger" />
            <p className="mt-4 text-h3 font-semibold text-ink">Couldn't sign in</p>
            <p className="mt-1.5 text-label text-ink-muted">{error}</p>
            <div className="mt-6 w-full max-w-xs">
              <PrimaryButton onClick={() => navigate("/signin", { replace: true })}>
                Try again
              </PrimaryButton>
            </div>
          </>
        ) : (
          <>
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-label text-ink-muted">Completing sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
}
