import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title?: ReactNode;
  /** Show a back chevron. If `back` is a string, navigate there; else go(-1). */
  back?: boolean | string;
  right?: ReactNode;
  /** Transparent over a colored hero instead of the sand surface. */
  transparent?: boolean;
}

export default function TopBar({ title, back, right, transparent = false }: Props) {
  const navigate = useNavigate();
  return (
    <header
      className={`relative z-20 flex h-14 shrink-0 items-center px-2 ${
        transparent ? "" : "border-b border-hairline bg-surface/90 backdrop-blur"
      }`}
    >
      <div className="flex w-12 items-center">
        {back && (
          <button
            aria-label="Back"
            onClick={() => (typeof back === "string" ? navigate(back) : navigate(-1))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink active:bg-black/5"
          >
            <ChevronLeft size={26} />
          </button>
        )}
      </div>
      <div className="flex-1 truncate text-center text-h2 text-ink">{title}</div>
      <div className="flex w-12 items-center justify-end">{right}</div>
    </header>
  );
}
