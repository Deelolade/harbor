import { useEffect, useRef, useState } from "react";

type Mode = "signup" | "signin";

interface Task {
  label: string;
  tag: string;
}

const visualContent: Record<
  Mode,
  {
    command: string;
    checks: string[];
    statusBefore: string;
    statusAfter: string;
    items: Task[];
    caption: string;
  }
> = {
  signup: {
    command: "flux init workspace",
    checks: [
      "✓ syncing calendars",
      "✓ inviting teammates",
      "✓ workspace ready",
    ],
    statusBefore: "workspace status: provisioning",
    statusAfter: "workspace status: online",
    items: [
      { label: "Review onboarding flow", tag: "design" },
      { label: "Ship release v2.4", tag: "v2.4" },
      { label: "Post standup notes", tag: "daily" },
      { label: "Client sync at 3pm", tag: "client" },
    ],
    caption:
      '4 teammates already added to <strong style="color:#A1A1AA;">Harbor Product</strong> workspace.',
  },
  signin: {
    command: "flux resume session",
    checks: [
      "✓ verifying credentials",
      "✓ restoring workspace",
      "✓ session active",
    ],
    statusBefore: "session status: authenticating",
    statusAfter: "session status: active",
    items: [
      { label: "3 new comments on Design review", tag: "now" },
      { label: "v2.4 shipped to production", tag: "2h" },
      { label: "Client sync starts in 20 min", tag: "soon" },
      { label: "2 teammates online", tag: "live" },
    ],
    caption:
      'Last active <strong style="color:#A1A1AA;">2 hours ago</strong> from this device.',
  },
};

export default function VisualPanel({ mode }: { mode: Mode }) {
  const cfg = visualContent[mode];
  const sessionRef = useRef(0);
  const [typedText, setTypedText] = useState("");
  const [showChecks, setShowChecks] = useState<string[]>([]);
  const [statusText, setStatusText] = useState(cfg.statusBefore);
  const [tasks] = useState<Task[]>(cfg.items);
  const [doneTasks, setDoneTasks] = useState<Set<number>>(new Set());
  const reduceMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    sessionRef.current++;
    const mySession = sessionRef.current;
    setTypedText("");
    setShowChecks([]);
    setStatusText(cfg.statusBefore);
    setDoneTasks(new Set());

    if (reduceMotion.current) {
      setTypedText(cfg.command);
      return;
    }
    let i = 0;
    const iv = setInterval(() => {
      if (sessionRef.current !== mySession) return clearInterval(iv);
      setTypedText(cfg.command.slice(0, i + 1));
      i++;
      if (i >= cfg.command.length) clearInterval(iv);
    }, 38);
    return () => clearInterval(iv);
  }, [mode]);

  useEffect(() => {
    if (typedText !== cfg.command) return;
    const mySession = sessionRef.current;
    let i = 0;
    const step = () => {
      if (sessionRef.current !== mySession) return;
      if (i >= cfg.checks.length) {
        setStatusText(cfg.statusAfter);
        return;
      }
      setShowChecks(cfg.checks.slice(0, i + 1));
      i++;
      setTimeout(step, reduceMotion.current ? 0 : 400);
    };
    const t = setTimeout(step, reduceMotion.current ? 0 : 300);
    return () => clearTimeout(t);
  }, [typedText]);

  useEffect(() => {
    const mySession = sessionRef.current;
    let timeout: ReturnType<typeof setTimeout>;
    const loop = () => {
      if (sessionRef.current !== mySession) return;
      setDoneTasks(new Set());
      let i = 0;
      const step = () => {
        if (sessionRef.current !== mySession) return;
        if (i >= tasks.length) {
          timeout = setTimeout(loop, 2200);
          return;
        }
        setDoneTasks((prev) => new Set(prev).add(i));
        i++;
        timeout = setTimeout(step, 550);
      };
      timeout = setTimeout(step, reduceMotion.current ? 0 : 800);
    };
    timeout = setTimeout(loop, reduceMotion.current ? 0 : 2000);
    return () => clearTimeout(timeout);
  }, [tasks, mode]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-12">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/[0.03] blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-amber-500/[0.02] blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[13px] font-medium text-zinc-400">
            {statusText}
          </span>
        </div>

        {/* Terminal */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono text-[15px]">
            <span className="select-none text-zinc-600">$</span>
            <span className="text-white">{typedText}</span>
            {typedText !== cfg.command && (
              <span className="inline-block h-[18px] w-[2px] animate-pulse bg-zinc-400" />
            )}
          </div>
          {showChecks.map((line, i) => (
            <div
              key={i}
              className="font-mono text-[14px] text-emerald-400 transition-opacity duration-300"
            >
              {line}
            </div>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-1.5">
          {tasks.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 transition-all duration-300"
            >
              <div
                className={`flex h-4 w-4 items-center justify-center rounded border transition-all duration-300 ${
                  doneTasks.has(i)
                    ? "border-amber-500 bg-amber-500/20"
                    : "border-zinc-700"
                }`}
              >
                {doneTasks.has(i) && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#EAB308"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="flex-1 text-[14px] text-zinc-300">
                {item.label}
              </span>
              <span className="rounded-md border border-white/[0.05] bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                {item.tag}
              </span>
            </div>
          ))}
        </div>

        <p
          className="text-[13px] text-zinc-500"
          dangerouslySetInnerHTML={{ __html: cfg.caption }}
        />
      </div>
    </div>
  );
}
