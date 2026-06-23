import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ShieldCheck, CreditCard } from "lucide-react";
import { savings } from "../lib/data";
import { useDemo } from "../state/DemoContext";
import { useToast } from "../components/Toast";
import ScreenHeader from "../components/ScreenHeader";
import { Group, Row, Toggle } from "../components/SettingsList";
import ChipGroup from "../components/ChipGroup";
import SegmentedControl from "../components/SegmentedControl";
import { CATEGORY_OPTIONS, BRAND_OPTIONS, TRAVEL_STYLE_OPTIONS } from "../lib/preferences";

/**
 * Screen 15 — Settings. Plan/subscription, personalization Preferences, and
 * notification controls. Inbox connection and "delete my data" now live on the
 * separate Privacy screen so the deletion intent isn't mixed in here.
 */
export default function Settings() {
  const navigate = useNavigate();
  const { tier, downgrade, goPremium, preferences, setPreferences } = useDemo();
  const toast = useToast();
  const { trial } = savings;

  const [notifyDrops, setNotifyDrops] = useState(true);
  const [notifyExpiry, setNotifyExpiry] = useState(true);

  const statusLabel =
    tier === "paid"
      ? "Premium · annual"
      : tier === "trial"
      ? `Trial · day ${trial.dayOfTrial} of ${trial.lengthDays}`
      : "Free";

  const togglePref = (key: "categories" | "brands", value: string) => {
    const list = preferences[key];
    setPreferences({
      [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    });
    toast.show("Saved");
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ScreenHeader title="Settings" />

      <div>
        {/* Subscription */}
        <Group title="Subscription">
          <Row Icon={CreditCard} title="Plan" subtitle={statusLabel}>
            {tier === "paid" ? (
              <button
                onClick={() => {
                  downgrade();
                  toast.show("Subscription canceled");
                }}
                className="text-label font-semibold text-ink-muted"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => navigate(tier === "trial" ? "/paywall" : "/trial")}
                className="text-label font-semibold text-primary"
              >
                {tier === "trial" ? "Upgrade" : "Subscribe"}
              </button>
            )}
          </Row>
        </Group>

        {/* Preferences */}
        <div className="mb-4">
          <p className="mb-1.5 px-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
            Preferences
          </p>
          <div className="space-y-5 rounded-card border border-hairline bg-card p-4 shadow-card">
            <p className="-mt-0.5 text-caption text-ink-muted">
              What you told us about you — edit anytime.
            </p>

            <PrefField label="What you shop for">
              <ChipGroup
                options={CATEGORY_OPTIONS}
                selected={preferences.categories}
                onToggle={(v) => togglePref("categories", v)}
              />
            </PrefField>

            <PrefField label="Favorite brands">
              <ChipGroup
                options={BRAND_OPTIONS}
                selected={preferences.brands}
                onToggle={(v) => togglePref("brands", v)}
              />
            </PrefField>

            <PrefField label="Home airport">
              <input
                value={preferences.homeAirport}
                onChange={(e) =>
                  setPreferences({ homeAirport: e.target.value.toUpperCase().slice(0, 3) })
                }
                onBlur={() => toast.show("Saved")}
                placeholder="e.g. JFK"
                className="nums w-32 rounded-button border border-hairline bg-surface px-4 py-3 text-h2 uppercase tracking-wider text-ink outline-none focus:border-primary"
              />
            </PrefField>

            <PrefField label="Travel style">
              <SegmentedControl
                options={TRAVEL_STYLE_OPTIONS}
                value={preferences.travelStyle}
                onChange={(v) => {
                  setPreferences({ travelStyle: v });
                  toast.show("Saved");
                }}
              />
            </PrefField>
          </div>
        </div>

        {/* Notifications */}
        <Group title="Notifications">
          <Row Icon={Bell} title="Fare-drop alerts" subtitle="Only when below target">
            <Toggle on={notifyDrops} onChange={setNotifyDrops} />
          </Row>
          <Row Icon={Bell} title="Deal expiry reminders" subtitle="Ending-soon nudges">
            <Toggle on={notifyExpiry} onChange={setNotifyExpiry} />
          </Row>
        </Group>

        <p className="mt-4 flex items-center justify-center gap-1.5 px-6 text-center text-caption text-ink-muted">
          <ShieldCheck size={14} className="text-primary" /> Ranking is never influenced by
          payout.
        </p>

        {/* Demo convenience: jump back into premium */}
        {tier === "free" && (
          <button
            onClick={() => goPremium("paid")}
            className="mt-3 w-full py-2 text-center text-caption font-semibold text-primary"
          >
            (Demo) restore premium
          </button>
        )}
      </div>
    </div>
  );
}

function PrefField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-label font-semibold text-ink">{label}</p>
      {children}
    </div>
  );
}
