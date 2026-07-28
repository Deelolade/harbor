import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiLayers,
  FiUsers,
  FiCheckSquare,
  FiMenu,
  FiX,
  FiBell,
  FiPlus,
  FiSearch,
  FiGrid,
  FiCalendar,
  FiMessageCircle,
} from "react-icons/fi";

const features = [
  {
    icon: FiLayers,
    title: "Projects & Boards",
    description:
      "Organize work into projects and kanban boards. Drag tasks across columns to keep everything flowing.",
  },
  {
    icon: FiUsers,
    title: "Team Collaboration",
    description:
      "Invite your team, assign tasks, and stay in sync with real-time activity streams and notifications.",
  },
  {
    icon: FiCheckSquare,
    title: "Tasks & Subtasks",
    description:
      "Break down work into manageable pieces. Track progress with subtasks, comments, and due dates.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create a workspace",
    description:
      "Spin up a workspace for your team. Invite members and set up roles in seconds.",
  },
  {
    step: "02",
    title: "Build your board",
    description:
      "Create projects, columns, and tasks. Customize workflows to match how your team already works.",
  },
  {
    step: "03",
    title: "Collaborate & ship",
    description:
      "Assign tasks, leave comments, and track activity in real time. Stay aligned without meetings.",
  },
];

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#0D0E12]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm font-extrabold text-black">
            H
          </div>
          Harbor
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            How it works
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/sign-in"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/sign-up"
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="text-zinc-400 md:hidden"
        >
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/[0.04] bg-[#0D0E12] px-6 pb-6 pt-4 md:hidden">
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="block py-2 text-sm text-zinc-400"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="block py-2 text-sm text-zinc-400"
          >
            How it works
          </a>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              to="/sign-in"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              Sign in
            </Link>
            <Link
              to="/sign-up"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-center text-sm font-semibold text-black"
            >
              Get started free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function DashboardPreview() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111318] shadow-2xl shadow-black/40">
        {/* Mock top bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-amber-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
          </div>
          <div className="ml-3 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-500">
            <FiSearch size={13} />
            Search...
          </div>
          <div className="ml-auto flex items-center gap-3">
            <FiBell size={16} className="text-zinc-500" />
            <div className="h-7 w-7 rounded-full bg-amber-500/20" />
          </div>
        </div>

        {/* Mock sidebar + board */}
        <div className="flex h-80">
          {/* Sidebar */}
          <div className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-white/[0.04] p-3 sm:flex">
            <div className="mb-1 flex items-center gap-2 rounded-lg bg-amber-500/10 px-2.5 py-2 text-xs font-medium text-amber-400">
              <FiGrid size={14} />
              Board
            </div>
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-zinc-500">
              <FiCalendar size={14} />
              Timeline
            </div>
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-zinc-500">
              <FiMessageCircle size={14} />
              Messages
            </div>
          </div>

          {/* Board columns */}
          <div className="flex flex-1 gap-4 overflow-hidden p-4">
            {["To do", "In progress", "Done"].map((col, i) => (
              <div
                key={col}
                className="flex w-56 shrink-0 flex-col gap-3 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        i === 0
                          ? "bg-zinc-400"
                          : i === 1
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                    />
                    <span className="text-xs font-medium text-zinc-400">
                      {col}
                    </span>
                  </div>
                  <FiPlus size={13} className="text-zinc-600" />
                </div>
                {i < 2 && (
                  <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
                    <p className="text-xs font-medium text-zinc-300">
                      {i === 0
                        ? "Design onboarding flow"
                        : "Build auth endpoints"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-amber-500/30" />
                      <span className="text-[11px] text-zinc-600">
                        {i === 0 ? "Due Fri" : "In review"}
                      </span>
                    </div>
                  </div>
                )}
                <button className="flex items-center gap-1.5 rounded-lg py-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400">
                  <FiPlus size={12} />
                  Add task
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0D0E12] text-white">
      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center px-6 pb-20 pt-32 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-amber-500/5 blur-[140px]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <span className="mb-4 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-[13px] font-medium text-amber-400">
            Now in early access
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            The workspace
            <br />
            <span className="text-amber-500">your team deserves</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            Harbor brings projects, tasks, and your team together. Plan, track,
            and ship — without the clutter.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-[15px] font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Get started free
              <FiArrowRight size={18} />
            </Link>
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-transparent px-8 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/[0.04]"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-4 text-sm text-zinc-600">
            No credit card required · Free forever plan
          </p>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="pb-28">
        <DashboardPreview />
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-32">
        <div className="mb-16 text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-amber-400">
            Features
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Everything you need to stay on track
          </h2>
          <p className="mt-3 text-zinc-400">
            Simple tools that scale with your team.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.10] hover:bg-white/[0.03]"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Icon size={22} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 pb-32">
        <div className="mb-16 text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-amber-400">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Start shipping in minutes
          </h2>
          <p className="mt-3 text-zinc-400">
            Three simple steps to get your team moving.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map(({ step, title, description }, i) => (
            <div key={step} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="absolute top-8 left-[60%] hidden h-px w-[80%] bg-white/[0.06] sm:block" />
              )}
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-lg font-bold text-amber-400">
                {step}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-4xl px-6 pb-32 text-center">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-12 sm:p-16">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-500/10 blur-[80px]" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-zinc-400">
              Join teams already using Harbor to plan, track, and ship better
              work.
            </p>
            <Link
              to="/sign-up"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-[15px] font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Create your workspace
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-xs font-extrabold text-black">
              H
            </div>
            Harbor
          </Link>

          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a
              href="#features"
              className="transition-colors hover:text-zinc-300"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-zinc-300"
            >
              How it works
            </a>
            <Link to="/sign-in" className="transition-colors hover:text-zinc-300">
              Sign in
            </Link>
            <Link to="/sign-up" className="transition-colors hover:text-zinc-300">
              Sign up
            </Link>
          </div>

          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} Harbor
          </p>
        </div>
      </footer>
    </div>
  );
}
