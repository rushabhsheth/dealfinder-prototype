import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  PauseCircle,
  Bell,
  Trash2,
  ShieldCheck,
  ChevronRight,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { savings } from "../lib/data";
import { useDemo } from "../state/DemoContext";
import { useToast } from "../components/Toast";
import BottomNav from "../components/BottomNav";

/**
 * Screen 15 — Settings & Privacy Controls. The trust controls: disconnect
 * inbox, pause scanning, delete data, notifications, subscription status.
 */
export default function Settings() {
  const navigate = useNavigate();
  const { tier, downgrade, goPremium } = useDemo();
  const toast = useToast();
  const { trial } = savings;

  const isPremium = tier === "trial" || tier === "paid";
  const [scanning, setScanning] = useState(isPremium);
  const [connected, setConnected] = useState(isPremium);
  const [notifyDrops, setNotifyDrops] = useState(true);
  const [notifyExpiry, setNotifyExpiry] = useState(true);

  const statusLabel =
    tier === "paid" ? "Premium · annual" : tier === "trial" ? `Trial · day ${trial.dayOfTrial} of ${trial.lengthDays}` : "Free";

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 bg-surface px-4 pb-2 pt-3">
        <h1 className="text-h1 text-ink">Settings</h1>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
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
                className="text-label font-semibold text-accent-pressed"
              >
                {tier === "trial" ? "Upgrade" : "Subscribe"}
              </button>
            )}
          </Row>
        </Group>

        {/* Privacy */}
        <Group title="Inbox & privacy">
          <Row
            Icon={Mail}
            title="Email connection"
            subtitle={connected ? "Gmail · read-only" : "Disconnected"}
          >
            <Toggle
              on={connected}
              onChange={(v) => {
                setConnected(v);
                if (!v) setScanning(false);
                toast.show(v ? "Inbox connected" : "Inbox disconnected");
              }}
            />
          </Row>
          <Row Icon={PauseCircle} title="Inbox scanning" subtitle={scanning ? "Active" : "Paused"}>
            <Toggle
              on={scanning}
              onChange={(v) => {
                if (v && !connected) {
                  toast.show("Connect your inbox first");
                  return;
                }
                setScanning(v);
              }}
            />
          </Row>
        </Group>

        {/* Notifications */}
        <Group title="Notifications">
          <Row Icon={Bell} title="Fare-drop alerts" subtitle="Only when below target">
            <Toggle on={notifyDrops} onChange={setNotifyDrops} />
          </Row>
          <Row Icon={Bell} title="Deal expiry reminders" subtitle="Ending-soon nudges">
            <Toggle on={notifyExpiry} onChange={setNotifyExpiry} />
          </Row>
        </Group>

        {/* Data */}
        <Group title="Your data">
          <button
            onClick={() => toast.show("Data deletion requested")}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <Trash2 size={20} className="text-accent-pressed" />
            <span className="flex-1">
              <span className="block text-body font-semibold text-accent-pressed">
                Delete my data
              </span>
              <span className="block text-caption text-ink-muted">
                Remove everything we've scanned — no questions asked
              </span>
            </span>
            <ChevronRight size={18} className="text-ink-muted" />
          </button>
        </Group>

        <p className="mt-4 flex items-center justify-center gap-1.5 px-6 text-center text-caption text-ink-muted">
          <ShieldCheck size={14} className="text-primary" /> Read-only access. Ranking is never
          influenced by payout.
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

      <BottomNav />
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 px-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </p>
      <div className="divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-card shadow-card">
        {children}
      </div>
    </div>
  );
}

function Row({
  Icon,
  title,
  subtitle,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon size={20} className="text-ink-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-ink">{title}</p>
        <p className="truncate text-caption text-ink-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? "bg-primary" : "bg-hairline"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
