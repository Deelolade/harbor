import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FiHome,
  FiActivity,
  FiFolder,
  FiUsers,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiChevronDown,
  FiGrid,
  FiPlus,
  FiClock,
} from "react-icons/fi";
import { authClient } from "../../lib/auth-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

interface ProjectItem {
  id: string;
  name: string;
  image?: string;
}

interface WorkspaceInfo {
  id: string;
  name: string;
  ownerId: string;
  _count: { members: number };
}

interface SidebarProps {
  workspaceId: string;
  workspaceName: string;
  collapsed: boolean;
  onToggle: () => void;
  onProfileClick: () => void;
}

export default function Sidebar({
  workspaceId,
  workspaceName,
  collapsed,
  onToggle,
  onProfileClick,
}: SidebarProps) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const navigate = useNavigate();
  const location = useLocation();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const { data: workspaces = [] } = useQuery<WorkspaceInfo[]>({
    queryKey: ["workspaces"],
    queryFn: () =>
      fetch(`${API_URL}/api/workspaces`, { credentials: "include" }).then((r) =>
        r.json(),
      ),
    staleTime: 30_000,
  });

  const { data: projects = [] } = useQuery<ProjectItem[]>({
    queryKey: ["sidebar-projects", workspaceId],
    queryFn: () =>
      fetch(`${API_URL}/api/workspaces/${workspaceId}/projects`, {
        credentials: "include",
      }).then((r) => r.json()),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const { data: activityCount = 0 } = useQuery<number>({
    queryKey: ["activity", workspaceId],
    queryFn: () =>
      fetch(`${API_URL}/api/workspaces/${workspaceId}/activity`, {
        credentials: "include",
      }).then((r) => (r.ok ? r.json() : [])),
    enabled: !!workspaceId,
    select: (data: any[]) => data.length,
    staleTime: 10_000,
  });

  const { data: unseen = 0 } = useQuery({
    queryKey: ["activity-unseen", workspaceId],
    queryFn: () =>
      fetch(`${API_URL}/api/workspaces/${workspaceId}/activity/unseen`, {
        credentials: "include",
      }).then((r) => (r.ok ? r.json() : { unseen: 0 })),
    enabled: !!workspaceId,
    select: (data: any) => data?.unseen ?? 0,
    refetchInterval: 15_000,
  });

  const handleActivityClick = () => {
    fetch(`${API_URL}/api/workspaces/${workspaceId}/activity/seen`, {
      method: "POST",
      credentials: "include",
    });
    navigate(`${basePath}/activity`);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/sign-in");
  };

  const basePath = `/workspace/${workspaceId}`;

  const navItems = [
    { icon: <FiHome size={15} />, label: "Home", path: basePath },
    // { icon: <FiInbox size={15} />, label: "Inbox", path: `${basePath}/inbox`, badge: "3" },
    {
      icon: <FiActivity size={15} />,
      label: "Activity",
      path: `${basePath}/activity`,
      badge: unseen > 0 ? String(unseen) : undefined,
      badgeColor: unseen > 0 ? "bg-blue-500 text-white" : undefined,
      onClick: handleActivityClick,
    },
    {
      icon: <FiUsers size={15} />,
      label: "Members",
      path: `${basePath}/members`,
    },
    {
      icon: <FiClock size={15} />,
      label: "Activity",
      path: `${basePath}/activity`,
    },
    // { icon: <FiEye size={15} />, label: "Client views", path: `${basePath}/clients` },
    {
      icon: <FiSettings size={15} />,
      label: "Settings",
      path: `${basePath}/settings`,
    },
  ];

  return (
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
          onClick={onToggle}
          className={`rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors ${collapsed ? "mx-auto" : ""}`}
        >
          {collapsed ? (
            <FiChevronRight size={15} />
          ) : (
            <FiChevronLeft size={15} />
          )}
        </button>
      </div>

      {/* Workspace switcher */}
      {!collapsed && (
        <div className="relative px-2 pb-2" ref={switcherRef}>
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-white hover:bg-white/[0.04] transition-colors"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-[10px] font-bold text-amber-400">
              {workspaceName.charAt(0).toUpperCase()}
            </span>
            <span className="flex-1 truncate text-left">{workspaceName}</span>
            <FiChevronDown
              size={13}
              className={`transition-transform ${switcherOpen ? "rotate-180" : ""}`}
            />
          </button>

          {switcherOpen && (
            <div className="absolute left-2 right-2 top-full z-50 rounded-xl border border-white/[0.06] bg-[#18181B] py-1 shadow-2xl">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Switch workspace
              </div>
              {workspaces
                .filter((w) => w.id !== workspaceId)
                .slice(0, 4)
                .map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      navigate(`/workspace/${ws.id}`);
                      setSwitcherOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-colors"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.04] text-[10px] font-bold">
                      {ws.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              <div className="border-t border-white/[0.04] mt-1 pt-1">
                <button
                  onClick={() => navigate("/workspaces")}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  <FiGrid size={14} />
                  <span>See all workspaces</span>
                </button>
                <button
                  onClick={() => navigate("/workspaces")}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  <FiPlus size={14} />
                  <span>Create workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2">
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
                    key={p.id}
                    onClick={() => navigate(`${basePath}/projects/${p.id}`)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                      location.pathname.includes(`/projects/${p.id}`)
                        ? "text-white bg-white/[0.04]"
                        : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <FiFolder size={14} />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <SidebarItem
            icon={<FiFolder size={15} />}
            label="Projects"
            collapsed
          />
        )}

        {navItems.map((item, idx) => (
          <SidebarItem
            key={item.label || idx}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            collapsed={collapsed}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="space-y-0.5 border-t border-white/[0.05] px-2 pt-2 pb-3">
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={`flex w-full items-center gap-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-red-400 transition-colors ${
            collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2"
          }`}
        >
          <FiLogOut size={15} />
          {!collapsed && <span className="flex-1 text-left">Sign out</span>}
        </button>

        <button
          onClick={onProfileClick}
          className={`flex w-full items-center rounded-lg hover:bg-white/[0.04] transition-colors ${
            collapsed ? "justify-center py-1.5" : "gap-3 px-2.5 py-1.5"
          }`}
        >
          <img
            src={user?.image || ""}
            alt=""
            className="h-7 w-7 rounded-full bg-white/[0.06]"
          />
          {!collapsed && (
            <div className="flex-1 overflow-hidden text-left">
              <p className="truncate text-[13px] font-medium">
                {user?.name || "User"}
              </p>
              <p className="truncate text-[11px] capitalize text-zinc-500">
                {user?.role?.toLowerCase() || "member"}
              </p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  badge,
  badgeColor,
  collapsed,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  collapsed: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg text-sm font-medium transition-colors ${
        collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2"
      } ${
        active
          ? "text-white bg-white/[0.04]"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {icon}
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {badge && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${badgeColor || "bg-white/[0.06] text-zinc-500"}`}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}
