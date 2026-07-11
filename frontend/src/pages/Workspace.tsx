import { useState } from "react";
import { authClient } from "../lib/auth-client";
import {
  FiHome,
  FiInbox,
  FiCheckSquare,
  FiFolder,
  FiUsers,
  FiEye,
  FiChevronDown,
  FiChevronRight,
  FiLayers,
  FiTarget,
} from "react-icons/fi";

const projects = [
  {
    name: "Design System",
    icon: <FiLayers size={14} />,
    color: "text-violet-400",
  },
  {
    name: "Marketing Site",
    icon: <FiTarget size={14} />,
    color: "text-amber-400",
  },
  { name: "Mobile App", icon: <FiEye size={14} />, color: "text-emerald-400" },
];

export default function Workspace() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [projectsOpen, setProjectsOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#0D0E12] text-white">
      {/* ── Sidebar ── */}
      <aside className="flex w-56 flex-col border-r border-white/[0.05] bg-[#111318]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
            <svg
              className="h-3.5 w-3.5 text-amber-500"
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
          <span className="text-sm font-semibold tracking-tight">Harbor</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2">
          <SidebarItem icon={<FiHome size={15} />} label="Home" />
          <SidebarItem icon={<FiInbox size={15} />} label="Inbox" badge="3" />
          <SidebarItem
            icon={<FiCheckSquare size={15} />}
            label="My tasks"
            badge="7"
          />

          {/* Projects — expandable */}
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <FiFolder size={15} />
            <span className="flex-1 text-left">Projects</span>
            {projectsOpen ? (
              <FiChevronDown size={13} />
            ) : (
              <FiChevronRight size={13} />
            )}
          </button>

          {projectsOpen && (
            <div className="ml-2 space-y-0.5 border-l border-white/[0.04] pl-3">
              {projects.map((p) => (
                <button
                  key={p.name}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 hover:bg-white/[0.04] hover:text-white transition-colors"
                >
                  <span className={p.color}>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          )}

          <SidebarItem icon={<FiUsers size={15} />} label="Members" />
          <SidebarItem icon={<FiEye size={15} />} label="Client views" />
        </nav>

        {/* User pill */}
        <div className="flex items-center gap-3 border-t border-white/[0.05] p-4">
          <img
            src={user?.image || ""}
            alt=""
            className="h-7 w-7 rounded-full bg-white/[0.06]"
          />
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-[13px] font-medium">
              {user?.name || "User"}
            </p>
            <p className="truncate text-[11px] text-zinc-500">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            Welcome, {user?.name?.split(" ")[0] || "User"}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">Your workspace is ready.</p>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-colors">
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">
          {badge}
        </span>
      )}
    </button>
  );
}
