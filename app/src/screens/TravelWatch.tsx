import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Bell, TrendingDown, Plus, ArrowRight } from "lucide-react";
import { watches as seedWatches } from "../lib/data";
import { usd } from "../lib/format";
import type { Watch } from "../types";
import BottomNav from "../components/BottomNav";
import TopAppBar from "../components/TopAppBar";

/**
 * Screen 11 — Travel Watch (premium). Set a route/price watch; one seeded
 * watch is in a fare-drop alert state. Fare data is mocked (CLAUDE.md).
 */
export default function TravelWatch() {
  const navigate = useNavigate();
  const [watches, setWatches] = useState<Watch[]>(seedWatches);
  const [origin, setOrigin] = useState("SFO");
  const [dest, setDest] = useState("");
  const [target, setTarget] = useState("");

  function addWatch() {
    if (!origin || !dest || !target) return;
    const w: Watch = {
      id: `wt-${Date.now()}`,
      origin: origin.toUpperCase(),
      originCity: origin.toUpperCase(),
      destination: dest.toUpperCase(),
      destinationCity: dest.toUpperCase(),
      targetPrice: Number(target),
      currentPrice: Number(target) + 80,
      lowestSeen: Number(target) + 60,
      status: "watching",
      alertMessage: null,
      linkedDealId: null,
      createdAt: "2026-06-15",
    };
    setWatches((list) => [w, ...list]);
    setDest("");
    setTarget("");
  }

  return (
    <div className="flex h-full flex-col">
      <TopAppBar title="Flight Fare Deals">
        <p className="text-caption text-ink-muted">
          We'll only ping you when a fare drops below your target.
        </p>
      </TopAppBar>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
        {/* New watch */}
        <div className="rounded-card border border-hairline bg-card p-4 shadow-card">
          <p className="mb-2.5 text-label font-semibold uppercase tracking-wide text-ink-muted">
            Watch a route
          </p>
          <div className="flex items-center gap-2">
            <RouteInput value={origin} onChange={setOrigin} placeholder="SFO" />
            <Plane size={16} className="shrink-0 text-ink-muted" />
            <RouteInput value={dest} onChange={setDest} placeholder="JFK" />
            <div className="flex items-center rounded-button border border-hairline bg-surface px-2">
              <span className="text-body text-ink-muted">$</span>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="300"
                inputMode="numeric"
                className="nums w-14 bg-transparent py-2.5 text-body text-ink outline-none"
              />
            </div>
          </div>
          <button
            onClick={addWatch}
            disabled={!origin || !dest || !target}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-button bg-primary py-2.5 text-label font-semibold text-white disabled:opacity-40"
          >
            <Plus size={16} /> Add watch
          </button>
        </div>

        {/* Active watches */}
        <div className="mt-4 space-y-3">
          {watches.map((w) => (
            <WatchCard key={w.id} watch={w} onOpen={() => w.linkedDealId && navigate(`/deal/${w.linkedDealId}`)} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function RouteInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 3))}
      placeholder={placeholder}
      className="nums w-16 rounded-button border border-hairline bg-surface px-3 py-2.5 text-center text-body uppercase tracking-wider text-ink outline-none focus:border-primary"
    />
  );
}

function WatchCard({ watch, onOpen }: { watch: Watch; onOpen: () => void }) {
  const isAlert = watch.status === "alert";
  return (
    <div
      className={`rounded-card border p-4 shadow-card ${
        isAlert ? "border-savings bg-savings-tint/40" : "border-hairline bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="nums text-h2 text-ink">{watch.origin}</span>
          <Plane size={15} className="text-ink-muted" />
          <span className="nums text-h2 text-ink">{watch.destination}</span>
        </div>
        {isAlert ? (
          <span className="inline-flex items-center gap-1 rounded-badge bg-savings px-2.5 py-1 text-label font-semibold text-white">
            <Bell size={13} /> Alert
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-badge bg-surface px-2.5 py-1 text-label font-semibold text-ink-muted">
            Watching
          </span>
        )}
      </div>

      <p className="mt-1 text-caption text-ink-muted">
        {watch.originCity} → {watch.destinationCity}
      </p>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-caption text-ink-muted">Current fare</p>
          <p className={`nums text-h1 ${isAlert ? "text-savings" : "text-ink"}`}>
            {usd(watch.currentPrice)}
          </p>
        </div>
        <p className="nums text-caption text-ink-muted">target {usd(watch.targetPrice)}</p>
      </div>

      {isAlert ? (
        <button
          onClick={onOpen}
          className="mt-3 flex w-full items-center justify-between rounded-button bg-savings px-4 py-2.5 text-label font-semibold text-white active:scale-[0.99]"
        >
          <span className="flex items-center gap-1.5">
            <TrendingDown size={16} /> {watch.alertMessage}
          </span>
          <ArrowRight size={16} />
        </button>
      ) : (
        <p className="nums mt-2 text-caption text-ink-muted">
          Lowest seen {usd(watch.lowestSeen)} · {usd(watch.currentPrice - watch.targetPrice)} above
          target
        </p>
      )}
    </div>
  );
}
