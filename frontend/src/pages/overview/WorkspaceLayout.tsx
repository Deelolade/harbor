import { useState } from "react";
import { Outlet, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiChevronRight } from "react-icons/fi";
import Sidebar from "../../components/workspace/Sidebar";
import ProfileModal from "../../components/workspace/ProfileModal";
import { authClient } from "../../lib/auth-client";

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
    select: (data) => data?.name || "",
  });

  const workspaceName = workspace || "Workspace";

  return (
    <div className="flex h-screen bg-[#0D0E12] text-white">
      <Sidebar
        workspaceId={workspaceId || ""}
        workspaceName={workspaceName}
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
          <span className="text-[13px] font-semibold text-white">
            {workspaceName}
          </span>
        </div>
        <Outlet />
      </main>

      {profileOpen && (
        <ProfileModal
          user={session?.user}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}
