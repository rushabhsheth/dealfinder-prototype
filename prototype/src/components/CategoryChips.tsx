interface Props {
  categories: string[];
  active: string;
  onChange: (c: string) => void;
}

/** Horizontal category filter chips. Active chip in teal. */
export default function CategoryChips({ categories, active, onChange }: Props) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {categories.map((c) => {
        const isActive = c === active;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`shrink-0 rounded-badge border px-3.5 py-1.5 text-label font-semibold transition-colors ${
              isActive
                ? "border-primary bg-primary text-white"
                : "border-hairline bg-card text-ink-muted"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
