/**
 * SegmentedControl — an equal-width single-select row (e.g. travel style).
 * Shared by the Interest Survey and Settings → Preferences.
 */
interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`flex-1 rounded-button border py-2.5 text-label font-semibold ${
            value === o.value
              ? "border-primary bg-primary text-white"
              : "border-hairline bg-card text-ink-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
