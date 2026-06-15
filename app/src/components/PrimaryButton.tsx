import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
}

/**
 * PrimaryButton — teal fill by default. The `accent` (apricot) variant is for
 * spotlight CTAs only: start trial, subscribe (DESIGN_SYSTEM.md).
 */
export default function PrimaryButton({
  variant = "primary",
  full = true,
  className = "",
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex h-12 items-center justify-center gap-2 rounded-button px-5 text-label font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]";
  const variants: Record<Variant, string> = {
    primary: "bg-primary text-white hover:bg-primary-pressed",
    accent: "bg-accent text-white hover:bg-accent-pressed",
    ghost: "bg-transparent text-primary hover:bg-primary-tint",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
