import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PrimaryButton from "../components/PrimaryButton";
import TopBar from "../components/TopBar";
import ChipGroup from "../components/ChipGroup";
import SegmentedControl from "../components/SegmentedControl";
import { CATEGORY_OPTIONS, BRAND_OPTIONS, TRAVEL_STYLE_OPTIONS } from "../lib/preferences";
import { useDemo } from "../state/DemoContext";
import type { TravelStyle } from "../types";

/**
 * Screen 4 — Interest Survey. Capture personalization inputs: categories,
 * favorite brands, home airport, travel style. Seeded from saved preferences;
 * Continue persists them, Skip leaves whatever was already saved
 * (USER_PREFERENCES_PRD.md §5.1).
 */
export default function InterestSurvey() {
  const navigate = useNavigate();
  const { preferences, setPreferences } = useDemo();
  const [cats, setCats] = useState<string[]>(preferences.categories);
  const [brands, setBrands] = useState<string[]>(preferences.brands);
  const [airport, setAirport] = useState(preferences.homeAirport);
  const [style, setStyle] = useState<TravelStyle>(preferences.travelStyle);

  const toggle = (value: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const onContinue = () => {
    setPreferences({ categories: cats, brands, homeAirport: airport, travelStyle: style });
    navigate("/connect");
  };

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
          <ChipGroup options={CATEGORY_OPTIONS} selected={cats} onToggle={(v) => toggle(v, cats, setCats)} />
        </Section>

        <Section title="Favorite brands">
          <ChipGroup options={BRAND_OPTIONS} selected={brands} onToggle={(v) => toggle(v, brands, setBrands)} />
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
          <SegmentedControl options={TRAVEL_STYLE_OPTIONS} value={style} onChange={setStyle} />
        </Section>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-hairline bg-card/95 px-4 pb-6 pt-3 backdrop-blur">
        <PrimaryButton onClick={onContinue}>
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
