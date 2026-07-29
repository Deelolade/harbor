import { useState } from "react";
import { Outlet, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiChevronRight } from "react-icons/fi";
import Sidebar from "../../components/workspace/Sidebar";
import ProfileModal from "../../components/workspace/ProfileModal";
import NotificationBell from "../../components/workspace/NotificationBell";
import { authClient } from "../../lib/auth-client";
import { useActivityStream } from "../../hooks/use-activity-stream";
import { useCommandPalette } from "../../hooks/use-command-palette";
import CommandPalette from "../../components/workspace/CommandPalette";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

export default function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: session } = authClient.useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: workspace } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () =>
      fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
        credentials: "include",
      }).then((r) => (r.ok ? r.json() : null)),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });

  const workspaceName = workspace?.name || "Workspace";
  const workspaceImage = workspace?.image || null;

  // Activate real-time activity stream for this workspace
  useActivityStream(workspaceId);

  // Command palette
  const palette = useCommandPalette();

  return (
    <div className="flex h-screen bg-[#0D0E12] text-white">
      <Sidebar
        workspaceId={workspaceId || ""}
        workspaceName={workspaceName}
        workspaceImage={workspaceImage}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        onProfileClick={() => setProfileOpen(true)}
      />

      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-2 border-b border-white/[0.04] px-8 py-3">
          <Link
            to="/workspaces"
            className="text-[13px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Workspaces
          </Link>
          <FiChevronRight size={13} className="text-zinc-700" />
          <span className="flex-1 text-[13px] font-semibold text-white">
            {workspaceName}
          </span>
          <NotificationBell />
        </div>
        <Outlet />
      </main>

      {profileOpen && (
        <ProfileModal
          user={session?.user}
          onClose={() => setProfileOpen(false)}
        />
      )}

      <CommandPalette
        open={palette.open}
        onClose={palette.close}
        query={palette.query}
        onQueryChange={palette.setQuery}
        mode={palette.mode}
        filtered={palette.filtered}
        activeIndex={palette.activeIndex}
      />
    </div>
  );
}
