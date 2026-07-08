import { FaGoogle, FaGithub, FaApple } from "react-icons/fa";
import { cn } from "../../lib/utils";

interface SocialButtonProps {
  provider: "google" | "github" | "apple";
  onClick: () => void;
  className?: string;
}

const icons: Record<string, React.ReactNode> = {
  google: <FaGoogle size={18} />,
  github: <FaGithub size={20} />,
  apple: <FaApple size={20} />,
};

const labels: Record<string, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
  apple: "Continue with Apple",
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
        "flex h-12 w-full items-center justify-center gap-3 rounded-full border border-white/[0.06] bg-transparent text-[15px] font-medium text-white transition-all hover:border-white/[0.12] hover:bg-white/[0.03]",
        className,
      )}
    >
      {icons[provider]}
      <span>{labels[provider]}</span>
    </button>
  );
}
