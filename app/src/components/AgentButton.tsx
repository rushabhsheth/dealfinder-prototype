import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * AgentButton — top-right entry point to the conversational DealFinder agent.
 * A teal "AI" affordance with a small live dot to signal it's always on.
 */
export default function AgentButton() {
  const navigate = useNavigate();
  return (
    <button
      aria-label="Chat with your agent"
      onClick={() => navigate("/chat")}
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-card active:scale-95"
    >
      <Sparkles size={20} />
      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
    </button>
  );
}
