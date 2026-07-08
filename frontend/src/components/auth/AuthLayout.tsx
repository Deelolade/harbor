import { type ReactNode } from "react";
import { FiLock } from "react-icons/fi";
import IllustrationPanel from "./IllustrationPanel";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#050505]">
      {/* ── Left: Glass Card ── */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[480px] rounded-3xl border border-white/[0.06] bg-[#0D0D0D] p-10 shadow-2xl shadow-black/80 backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
              <FiLock size={15} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Acme
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[26px] font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-500">
            {subtitle}
          </p>

          {/* Form */}
          <div className="mt-8">{children}</div>

          {/* Footer */}
          <p className="mt-8 text-center text-[14px] text-zinc-500">{footer}</p>
        </div>
      </div>

      {/* ── Right: Illustration ── */}
      <div className="relative hidden w-1/2 overflow-hidden bg-[#080808] lg:block">
        <IllustrationPanel />
      </div>
    </div>
  );
}
