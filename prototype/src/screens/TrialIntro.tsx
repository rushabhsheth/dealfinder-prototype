import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { savings } from "../lib/data";
import { useDemo } from "../state/DemoContext";
import type { TravelStyle } from "../types";
import { CATEGORY_OPTIONS, BRAND_OPTIONS, TRAVEL_STYLE_OPTIONS } from "../lib/preferences";
import TopBar from "../components/TopBar";
import PrimaryButton from "../components/PrimaryButton";
import ChipGroup from "../components/ChipGroup";
import SegmentedControl from "../components/SegmentedControl";

/**
 * Screen 3 — Meet your agent. The whole pre-scan onboarding as one chat: the
 * DealFinder agent introduces itself, gathers personalization (categories,
 * brands, home airport, travel style), then walks through connecting the inbox
 * and auto-enrolling — all conversationally. Finishing leads into the scan.
 */
type Step = "categories" | "brands" | "airport" | "style" | "connect" | "enroll" | "scan";

interface Msg {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const QUESTION: Record<Exclude<Step, "scan">, string> = {
  categories: "First — what do you like to shop for? Pick whatever fits.",
  brands: "Any brands you love? I'll watch them for deals.",
  airport: "Where do you fly from? Your home airport helps me catch fare drops.",
  style: "And how do you like to travel?",
  connect:
    "Perfect — that's all I need.\n\nNow let's connect your inbox so I can find your deals. It's read-only: I only read promos, receipts, and travel — never personal or work email, and I never send mail as you.",
  enroll:
    "Some of the best deals only go to subscribers. Want me to join high-value newsletters for you — Delta, Patagonia, Marriott and the like — and pull their offers into your feed? Unsubscribe anytime, one tap.",
};

let nextId = 1;

export default function TrialIntro() {
  const navigate = useNavigate();
  const { trial } = savings;
  const { preferences, setPreferences, setInboxConnected } = useDemo();

  const [cats, setCats] = useState<string[]>(preferences.categories);
  const [brands, setBrands] = useState<string[]>(preferences.brands);
  const [airport, setAirport] = useState(preferences.homeAirport);
  const [style, setStyle] = useState<TravelStyle>(preferences.travelStyle);

  const [step, setStep] = useState<Step>("categories");
  const [typing, setTyping] = useState(false);
  const [connecting, setConnecting] = useState<null | "Gmail" | "Outlook">(null);
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: nextId++,
      role: "assistant",
      text: `Hi — I'm Scout, your DealFinder agent. I help you find the best deals — scanning your inbox (read-only) and ranking what's actually worth it. Free for your first ${trial.lengthDays} days.`,
    },
    { id: nextId++, role: "assistant", text: QUESTION.categories },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, step]);

  // Push the user's answer, then (after a short "typing" beat) the agent's next
  // message — the rhythm that makes it feel conversational.
  function advance(answer: string, next: Exclude<Step, "scan">) {
    setMessages((m) => [...m, { id: nextId++, role: "user", text: answer }]);
    setTyping(true);
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: nextId++, role: "assistant", text: QUESTION[next] }]);
      setTyping(false);
      setStep(next);
    }, 650);
  }

  const answerCategories = () => {
    setPreferences({ categories: cats });
    advance(cats.length ? cats.join(", ") : "Surprise me", "brands");
  };
  const answerBrands = () => {
    setPreferences({ brands });
    advance(brands.length ? brands.join(", ") : "No favorites yet", "airport");
  };
  const answerAirport = () => {
    setPreferences({ homeAirport: airport });
    advance(airport || "Not sure yet", "style");
  };
  const answerStyle = (v: TravelStyle) => {
    setStyle(v);
    setPreferences({ travelStyle: v });
    advance(TRAVEL_STYLE_OPTIONS.find((o) => o.value === v)!.label, "connect");
  };

  // Mocked OAuth handshake (CLAUDE.md hard rule 1) — a short beat, then enroll.
  const connect = (provider: "Gmail" | "Outlook") => {
    setConnecting(provider);
    window.setTimeout(() => {
      setConnecting(null);
      setInboxConnected(true);
      advance(`Connected ${provider}`, "enroll");
    }, 1200);
  };

  const finishEnroll = (enabled: boolean) => {
    setStep("scan");
    setMessages((m) => [
      ...m,
      { id: nextId++, role: "user", text: enabled ? "Yes, enroll me" : "Not now" },
    ]);
    setTyping(true);
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: nextId++,
          role: "assistant",
          text: enabled
            ? "Done — I'll keep them tidy. Scanning your inbox now…"
            : "No problem. Scanning your inbox now…",
        },
      ]);
      setTyping(false);
      window.setTimeout(() => navigate("/scan"), 1000);
    }, 650);
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <TopBar
        back="/"
        title={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={16} className="text-primary" /> Scout
          </span>
        }
      />

      {/* Conversation */}
      <div ref={scrollRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-body text-white">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                <Sparkles size={15} />
              </span>
              <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-md border border-hairline bg-card px-3.5 py-2.5 text-body text-ink shadow-card">
                {m.text}
              </div>
            </div>
          )
        )}

        {typing && (
          <div className="flex items-end gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
              <Sparkles size={15} />
            </span>
            <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-hairline bg-card px-4 py-3 shadow-card">
              <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </div>
          </div>
        )}
      </div>

      {/* Answer area — changes with the current question */}
      <div className="shrink-0 border-t border-hairline bg-card/95 px-4 pb-6 pt-3 backdrop-blur">
        {step === "categories" && (
          <Answer disabled={typing}>
            <div className="no-scrollbar max-h-40 overflow-y-auto">
              <ChipGroup
                options={CATEGORY_OPTIONS}
                selected={cats}
                onToggle={(v) =>
                  setCats((l) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]))
                }
              />
            </div>
            <PrimaryButton onClick={answerCategories}>
              Continue <ArrowRight size={18} />
            </PrimaryButton>
          </Answer>
        )}

        {step === "brands" && (
          <Answer disabled={typing}>
            <div className="no-scrollbar max-h-40 overflow-y-auto">
              <ChipGroup
                options={BRAND_OPTIONS}
                selected={brands}
                onToggle={(v) =>
                  setBrands((l) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]))
                }
              />
            </div>
            <PrimaryButton onClick={answerBrands}>
              Continue <ArrowRight size={18} />
            </PrimaryButton>
          </Answer>
        )}

        {step === "airport" && (
          <Answer disabled={typing}>
            <input
              value={airport}
              onChange={(e) => setAirport(e.target.value.toUpperCase().slice(0, 3))}
              placeholder="e.g. JFK"
              className="nums w-32 rounded-button border border-hairline bg-surface px-4 py-3 text-h2 uppercase tracking-wider text-ink outline-none focus:border-primary"
            />
            <PrimaryButton onClick={answerAirport}>
              Continue <ArrowRight size={18} />
            </PrimaryButton>
          </Answer>
        )}

        {step === "style" && (
          <Answer disabled={typing}>
            <SegmentedControl options={TRAVEL_STYLE_OPTIONS} value={style} onChange={answerStyle} />
          </Answer>
        )}

        {step === "connect" &&
          (connecting ? (
            <div className="flex h-12 items-center justify-center gap-2 rounded-button bg-primary/10 text-label font-semibold text-primary">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Connecting to {connecting}…
            </div>
          ) : (
            <Answer disabled={typing}>
              <PrimaryButton onClick={() => connect("Gmail")}>Connect Gmail</PrimaryButton>
              <button
                onClick={() => connect("Outlook")}
                className="flex h-12 w-full items-center justify-center rounded-button border border-hairline bg-card text-label font-semibold text-ink active:bg-surface"
              >
                Connect Outlook
              </button>
              <p className="text-center text-caption text-ink-muted">
                Read-only · disconnect &amp; delete anytime
              </p>
            </Answer>
          ))}

        {step === "enroll" && (
          <Answer disabled={typing}>
            <PrimaryButton onClick={() => finishEnroll(true)}>Yes, auto-enroll</PrimaryButton>
            <button
              onClick={() => finishEnroll(false)}
              className="w-full py-1.5 text-label font-semibold text-ink-muted"
            >
              Not now
            </button>
          </Answer>
        )}
      </div>
    </div>
  );
}

function Answer({ disabled, children }: { disabled: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-3 ${disabled ? "pointer-events-none opacity-50" : ""}`}>{children}</div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-ink-muted"
      style={{ animationDelay: delay }}
    />
  );
}
