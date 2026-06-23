import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { savings } from "../lib/data";
import { usd } from "../lib/format";
import PrimaryButton from "../components/PrimaryButton";

/** Subscribed confirmation — after converting on the paywall. */
export default function Subscribed() {
  const navigate = useNavigate();
  const { trial } = savings;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="animate-pulse-ring absolute inset-0 rounded-full bg-savings/30" />
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-savings text-white">
          <Check size={40} strokeWidth={3} />
        </span>
      </div>

      <h1 className="animate-fade-up mt-6 text-h1 text-ink">You're all set</h1>
      <p className="animate-fade-up mt-2 text-body text-ink-muted">
        Premium is active. Scout keeps scanning, ranking, and watching fares for you — for{" "}
        {usd(trial.annualPrice)}/year.
      </p>

      <div className="mt-8 w-full">
        <PrimaryButton onClick={() => navigate("/feed")}>
          Back to my deals <ArrowRight size={18} />
        </PrimaryButton>
      </div>
    </div>
  );
}
