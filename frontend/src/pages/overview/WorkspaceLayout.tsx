import { useState, useEffect } from "react";
import { Outlet, useParams, Link } from "react-router-dom";
import Sidebar from "../../components/workspace/Sidebar";
import ProfileModal from "../../components/workspace/ProfileModal";
import { authClient } from "../../lib/auth-client";
import { FiChevronRight } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

export default function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: session } = authClient.useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("Loading...");

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => setWorkspaceName(data.name || "Workspace"))
      .catch(() => setWorkspaceName("Workspace"));
  }, [workspaceId]);

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
        {/* Breadcrumb */}
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
