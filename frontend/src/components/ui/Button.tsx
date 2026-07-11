import { type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "pill";
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 text-[15px] font-semibold transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-40";

  const variants: Record<string, string> = {
    primary:
      "h-[52px] rounded-xl bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-600 px-6",
    secondary:
      "h-[52px] rounded-xl border border-[#1F1F23] bg-[#0D0E12] text-white hover:bg-[#111318] px-6",
    ghost: "text-zinc-400 hover:text-white px-2 py-1",
    pill: "h-12 rounded-full border border-white/[0.08] bg-transparent text-white hover:bg-white/[0.04] hover:border-white/[0.14] px-5",
  };

  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
