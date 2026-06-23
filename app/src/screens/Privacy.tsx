import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, PauseCircle, Store, Trash2, ShieldCheck, ChevronRight } from "lucide-react";
import { useDemo } from "../state/DemoContext";
import { useToast } from "../components/Toast";
import ScreenHeader from "../components/ScreenHeader";
import { Group, Row, Toggle } from "../components/SettingsList";

/**
 * Privacy & data. Kept separate from Settings so the "Delete my data" intent is
 * never mixed in with plan/notification toggles: inbox connection, scanning,
 * the Enrolled Brands ledger, and the isolated deletion action.
 */
export default function Privacy() {
  const navigate = useNavigate();
  const { inboxConnected, setInboxConnected } = useDemo();
  const toast = useToast();

  const [scanning, setScanning] = useState(inboxConnected);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ScreenHeader title="Privacy" />

      <div>
        {/* Inbox */}
        <Group title="Inbox">
          <Row
            Icon={Mail}
            title="Email connection"
            subtitle={inboxConnected ? "Gmail · read-only" : "Not connected"}
          >
            {inboxConnected ? (
              <Toggle
                on={inboxConnected}
                onChange={() => {
                  setInboxConnected(false);
                  setScanning(false);
                  toast.show("Inbox disconnected");
                }}
              />
            ) : (
              <button
                onClick={() => navigate("/connect", { state: { connectFlow: true } })}
                className="text-label font-semibold text-primary"
              >
                Connect
              </button>
            )}
          </Row>
          <Row
            Icon={PauseCircle}
            title="Inbox scanning"
            subtitle={inboxConnected ? (scanning ? "Active" : "Paused") : "Connect inbox first"}
          >
            <Toggle
              on={scanning && inboxConnected}
              onChange={(v) => {
                if (v && !inboxConnected) {
                  toast.show("Connect your inbox first");
                  return;
                }
                setScanning(v);
              }}
            />
          </Row>
        </Group>

        {/* Brands the inbox connection surfaces */}
        <Group title="What we surface">
          <button
            onClick={() => navigate("/brands")}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-surface"
          >
            <Store size={20} className="text-ink-muted" />
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold text-ink">Enrolled brands</span>
              <span className="block truncate text-caption text-ink-muted">
                See and manage every brand sending you deals
              </span>
            </span>
            <ChevronRight size={18} className="text-ink-muted" />
          </button>
        </Group>

        {/* Data — isolated deletion intent */}
        <Group title="Your data">
          <button
            onClick={() => toast.show("Data deletion requested")}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <Trash2 size={20} className="text-danger" />
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold text-danger">
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
          <ShieldCheck size={14} className="text-primary" /> Read-only access. We never send mail
          as you except a one-tap unsubscribe you ask for.
        </p>
      </div>
    </div>
  );
}
