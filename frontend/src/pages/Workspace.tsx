import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FiLogOut,
  FiX,
  FiCamera,
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
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/sign-in");
  };

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

        {/* Bottom section */}
        <div className="space-y-0.5 border-t border-white/[0.05] px-2 pt-2 pb-3">
          {/* Sign out */}
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

          {/* User pill */}
          <button
            onClick={() => setProfileOpen(true)}
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
                <p className="truncate text-[11px] text-zinc-500">
                  {user?.email}
                </p>
              </div>
            )}
          </button>
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

      {/* ── Profile Modal ── */}
      {profileOpen && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}

function ProfileModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(user?.image || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authClient.updateUser({ name, image });
      onClose();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Edit profile</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img
              src={image || ""}
              alt=""
              className="h-20 w-20 rounded-full bg-white/[0.06] object-cover"
            />
            <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-black hover:bg-amber-400 transition-colors">
              <FiCamera size={13} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-[44px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Avatar URL
            </label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="h-[44px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15"
              placeholder="https://..."
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="h-[44px] w-full rounded-xl bg-amber-500 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
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
