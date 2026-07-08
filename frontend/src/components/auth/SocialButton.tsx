import { cn } from "../../lib/utils";

interface SocialButtonProps {
  provider: "google" | "github";
  onClick: () => void;
  className?: string;
}

const icons: Record<string, React.ReactNode> = {
  google: (
    <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
      <path
        fill="#8992A6"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#8992A6"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0012 23z"
      />
      <path
        fill="#8992A6"
        d="M5.84 14.1a6.6 6.6 0 010-4.2V7.05H2.18a11 11 0 000 9.9z"
      />
      <path
        fill="#8992A6"
        d="M12 4.75c1.61 0 3.06.55 4.2 1.64l3.15-3.15C17.45 1.19 14.97 0 12 0A11 11 0 002.18 7.05L5.84 9.9C6.71 7.3 9.14 4.75 12 4.75z"
      />
    </svg>
  ),
  github: (
    <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
      <path
        fill="#8992A6"
        d="M12 .3a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.1-.75.08-.74.08-.74 1.2.09 1.84 1.24 1.84 1.24 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.31-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.87.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0012 .3z"
      />
    </svg>
  ),
};

const labels: Record<string, string> = {
  google: "Google",
  github: "GitHub",
};

export default function SocialButton({
  provider,
  onClick,
  className,
}: SocialButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border border-[#2A2A2E] bg-transparent px-3 py-[11px] text-[13.5px] font-medium text-white transition-all hover:border-zinc-500 hover:bg-white/[0.02] active:scale-[0.98]",
        className,
      )}
    >
      {icons[provider]}
      <span>{labels[provider]}</span>
    </button>
  );
}
