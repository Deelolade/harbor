import { type ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  description,
  children,
}: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen bg-gray-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-950/15 to-gray-950" />

      {/* ── Left: Glass panel ── */}
      <div className="relative z-10 flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-blue-950/25 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.08]">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="text-base font-semibold tracking-tight text-white">
                Acme
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-blue-200/60">{description}</p>
          </div>

          {children}
        </div>
      </div>

      {/* ── Right: Branding ── */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-center lg:px-20">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full border border-white/[0.04]" />
        <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full border border-white/[0.04]" />

        <div className="relative z-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">
            Build faster.
            <br />
            Scale smarter.
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-blue-200/45">
            The all-in-one platform for modern teams. Ship your next big idea
            with confidence.
          </p>

          <div className="mt-10 flex gap-2.5">
            <div className="h-1 rounded-full bg-white/25 w-8" />
            <div className="h-1 rounded-full bg-white/10 w-2" />
            <div className="h-1 rounded-full bg-white/10 w-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
