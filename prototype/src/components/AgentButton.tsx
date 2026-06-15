import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * AgentButton — top-right entry point to the conversational DealFinder agent.
 * A plain teal sparkle (no filled circle) so it sits quietly next to the title.
 */
export default function AgentButton() {
  const navigate = useNavigate();
  return (
    <button
      aria-label="Chat with your agent"
      onClick={() => navigate("/chat")}
      className="flex h-10 w-10 items-center justify-center rounded-full text-primary active:bg-primary-tint"
    >
      <Sparkles size={22} />
    </button>
  );
}
