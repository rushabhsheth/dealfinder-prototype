/**
 * ChipGroup — a wrap of multi-select pill chips. Shared by the Interest Survey
 * ("About you") and Settings → Preferences so both render identical controls
 * (USER_PREFERENCES_PRD.md §5.2).
 */
interface Props {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

export default function ChipGroup({ options, selected, onToggle }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            aria-pressed={active}
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
