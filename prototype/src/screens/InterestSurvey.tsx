import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PrimaryButton from "../components/PrimaryButton";
import TopBar from "../components/TopBar";

/**
 * Screen 4 — Interest Survey. Capture personalization inputs: categories,
 * favorite brands, home airport, travel style. All optional/skippable.
 */
const CATEGORIES = ["Travel", "Retail", "Dining", "Tech", "Home", "Fitness", "Beauty", "Kids"];
const BRANDS = ["Delta", "Patagonia", "Marriott", "Sonos", "Allbirds", "Sweetgreen", "Nike", "Apple"];
const TRAVEL_STYLES = ["Budget", "Comfort", "Luxury"];

export default function InterestSurvey() {
  const navigate = useNavigate();
  const [cats, setCats] = useState<string[]>(["Travel", "Retail"]);
  const [brands, setBrands] = useState<string[]>(["Delta", "Patagonia"]);
  const [airport, setAirport] = useState("SFO");
  const [style, setStyle] = useState("Comfort");

  const toggle = (
    value: string,
    list: string[],
    set: (v: string[]) => void
  ) => set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  return (
    <div className="flex h-full flex-col bg-surface">
      <TopBar back title="About you" />

      {/* Progress */}
      <div className="px-4 pt-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
          <div className="h-full w-1/3 rounded-full bg-primary" />
        </div>
        <p className="mt-1.5 text-caption text-ink-muted">Step 1 of 3 · all optional</p>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28 pt-3">
        <Section title="What do you shop for?">
          <ChipGroup options={CATEGORIES} selected={cats} onToggle={(v) => toggle(v, cats, setCats)} />
        </Section>

        <Section title="Favorite brands">
          <ChipGroup options={BRANDS} selected={brands} onToggle={(v) => toggle(v, brands, setBrands)} />
        </Section>

        <Section title="Home airport">
          <input
            value={airport}
            onChange={(e) => setAirport(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="e.g. SFO"
            className="nums w-32 rounded-button border border-hairline bg-card px-4 py-3 text-h2 uppercase tracking-wider text-ink outline-none focus:border-primary"
          />
        </Section>

        <Section title="Travel style">
          <div className="flex gap-2">
            {TRAVEL_STYLES.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`flex-1 rounded-button border py-2.5 text-label font-semibold ${
                  style === s
                    ? "border-primary bg-primary text-white"
                    : "border-hairline bg-card text-ink-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-hairline bg-card/95 px-4 pb-6 pt-3 backdrop-blur">
        <PrimaryButton onClick={() => navigate("/connect")}>
          Continue <ArrowRight size={18} />
        </PrimaryButton>
        <button
          onClick={() => navigate("/connect")}
          className="mt-1.5 w-full py-1.5 text-label font-semibold text-ink-muted"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2.5 text-h2 text-ink">{title}</h2>
      {children}
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={`rounded-badge border px-3.5 py-2 text-label font-semibold transition-colors ${
              active
                ? "border-primary bg-primary-tint text-primary-pressed"
                : "border-hairline bg-card text-ink-muted"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
