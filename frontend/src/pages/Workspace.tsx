import { useState } from "react";
import { authClient } from "../lib/auth-client";
import {
  FiHome,
  FiInbox,
  FiCheckSquare,
  FiFolder,
  FiUsers,
  FiEye,
  FiLayers,
  FiTarget,
  FiChevronLeft,
  FiChevronRight,
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
  const [collapsed, setCollapsed] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#0D0E12] text-white">
      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col border-r border-white/[0.05] bg-[#111318] transition-all duration-200 ${
          collapsed ? "w-[52px]" : "w-56"
        }`}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-3.5 py-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10">
                <svg
                  className="h-3 w-3 text-amber-500"
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
              <span className="text-[13px] font-semibold tracking-tight">
                Harbor
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors ${
              collapsed ? "mx-auto" : ""
            }`}
          >
            {collapsed ? (
              <FiChevronRight size={15} />
            ) : (
              <FiChevronLeft size={15} />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2">
          <SidebarItem
            icon={<FiHome size={15} />}
            label="Home"
            collapsed={collapsed}
          />
          <SidebarItem
            icon={<FiInbox size={15} />}
            label="Inbox"
            badge="3"
            collapsed={collapsed}
          />
          <SidebarItem
            icon={<FiCheckSquare size={15} />}
            label="My tasks"
            badge="7"
            collapsed={collapsed}
          />

          {/* Projects */}
          {!collapsed ? (
            <>
              <button
                onClick={() => setProjectsOpen(!projectsOpen)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <FiFolder size={15} />
                <span className="flex-1 text-left">Projects</span>
                <svg
                  className={`h-3 w-3 transition-transform ${projectsOpen ? "rotate-0" : "-rotate-90"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
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
            </>
          ) : (
            <SidebarItem
              icon={<FiFolder size={15} />}
              label="Projects"
              collapsed={collapsed}
            />
          )}

          <SidebarItem
            icon={<FiUsers size={15} />}
            label="Members"
            collapsed={collapsed}
          />
          <SidebarItem
            icon={<FiEye size={15} />}
            label="Client views"
            collapsed={collapsed}
          />
        </nav>

        {/* User pill */}
        {!collapsed ? (
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
              <p className="truncate text-[11px] text-zinc-500">
                {user?.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center border-t border-white/[0.05] py-4">
            <img
              src={user?.image || ""}
              alt=""
              className="h-7 w-7 rounded-full bg-white/[0.06]"
            />
          </div>
        )}
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
  collapsed,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  collapsed: boolean;
}) {
  return (
    <button
      title={collapsed ? label : undefined}
      className={`flex w-full items-center gap-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-colors ${
        collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2"
      }`}
    >
      {icon}
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {badge && (
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}
