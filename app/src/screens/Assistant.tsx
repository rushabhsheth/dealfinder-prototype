import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Sparkles, ChevronRight } from "lucide-react";
import { getDeal } from "../lib/data";
import { usd } from "../lib/format";
import { agentReply, GREETING, type AgentReply } from "../lib/agent";
import ScreenHeader from "../components/ScreenHeader";
import BrandMark from "../components/BrandMark";

/**
 * Conversational agent — a value-prop chat the user can talk to. Replies are
 * mocked (rule-based over the deal data); no backend. Reachable from the AI
 * button (top-right) on the main tab screens.
 */
interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  dealId?: string;
  followups?: string[];
}

let nextId = 1;

function toMessage(reply: AgentReply): Message {
  return { id: nextId++, role: "assistant", ...reply };
}

export default function Assistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([toMessage(GREETING)]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lastFollowups = !typing
    ? messages.filter((m) => m.role === "assistant").at(-1)?.followups ?? []
    : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, typing]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((m) => [...m, { id: nextId++, role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    const reply = agentReply(trimmed);
    window.setTimeout(() => {
      setMessages((m) => [...m, toMessage(reply)]);
      setTyping(false);
    }, 750);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <ScreenHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={20} className="text-primary" /> Scout
          </span>
        }
      />

      {/* Messages */}
      <div className="space-y-3 py-2">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-body text-white">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex flex-col items-start gap-2">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-hairline bg-card px-3.5 py-2.5 text-body text-ink shadow-card">
                {m.text}
              </div>
              {m.dealId && <DealChip dealId={m.dealId} onOpen={() => navigate(`/deal/${m.dealId}`)} />}
            </div>
          )
        )}

        {typing && (
          <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-hairline bg-card px-4 py-3 text-ink-muted shadow-card w-fit">
            <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions + input */}
      <div className="sticky bottom-16 z-20 border-t border-hairline bg-surface/95 pb-3 pt-2 backdrop-blur lg:bottom-0">
        {lastFollowups.length > 0 && (
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
            {lastFollowups.map((f) => (
              <button
                key={f}
                onClick={() => send(f)}
                className="shrink-0 rounded-badge border border-primary/40 bg-primary-tint/50 px-3 py-1.5 text-label font-semibold text-primary-pressed"
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Scout…"
            className="h-11 flex-1 rounded-full border border-hairline bg-surface px-4 text-body text-ink outline-none focus:border-primary"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!input.trim() || typing}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function DealChip({ dealId, onOpen }: { dealId: string; onOpen: () => void }) {
  const deal = getDeal(dealId);
  if (!deal) return null;
  return (
    <button
      onClick={onOpen}
      className="flex w-[85%] items-center gap-3 rounded-card border border-hairline bg-card p-3 text-left shadow-card active:scale-[0.99]"
    >
      <BrandMark initials={deal.brandInitials} category={deal.category} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label font-semibold text-ink">{deal.title}</p>
        {deal.savingsAmount > 0 && (
          <p className="nums text-caption text-savings">Save {usd(deal.savingsAmount)}</p>
        )}
      </div>
      <ChevronRight size={18} className="shrink-0 text-ink-muted" />
    </button>
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
