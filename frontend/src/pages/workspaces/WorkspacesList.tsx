import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiSearch, FiUsers, FiFolder } from "react-icons/fi";
import { authClient } from "../../lib/auth-client";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

interface WorkspaceCard {
  id: string;
  name: string;
  ownerId: string;
  owner: { id: string; name: string; image?: string };
  _count: { members: number };
  createdAt: string;
}

async function fetchWorkspaces(): Promise<WorkspaceCard[]> {
  const res = await fetch(`${API_URL}/api/workspaces`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load workspaces");
  return res.json();
}

const roleColors: Record<string, string> = {
  OWNER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ADMIN: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  MEMBER: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function WorkspacesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
  });

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setShowCreate(false);
      setNewName("");
      toast.success("Workspace created!");
    },
    onError: () => toast.error("Failed to create workspace."),
  });

  const filtered = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase()),
  );

  const owned = filtered.filter((ws) => ws.ownerId === session?.user?.id);
  const shared = filtered.filter((ws) => ws.ownerId !== session?.user?.id);

  return (
    <div className="min-h-screen bg-[#0D0E12] text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your workspaces</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            <FiPlus size={16} /> Create workspace
          </button>
        </div>

        <div className="relative mb-8">
          <FiSearch
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces..."
            className="h-[48px] w-full rounded-xl border border-[#1F1F23] bg-[#111318] pl-10 pr-4 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <FiFolder size={40} className="text-zinc-700 mb-4" />
            <p className="text-zinc-500">No workspaces found.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-sm font-medium text-amber-500 hover:text-amber-400"
            >
              Create your first workspace
            </button>
          </div>
        ) : (
          <>
            {owned.length > 0 && (
              <div className="mb-8">
                {shared.length > 0 && (
                  <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                    Owned by you
                  </h2>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {owned.map((ws) => (
                    <WorkspaceCard
                      key={ws.id}
                      workspace={ws}
                      onClick={() => navigate(`/workspace/${ws.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
            {shared.length > 0 && (
              <div>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Shared with you
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {shared.map((ws) => (
                    <WorkspaceCard
                      key={ws.id}
                      workspace={ws}
                      onClick={() => navigate(`/workspace/${ws.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Create workspace</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createMutation.mutate()}
              placeholder="Workspace name"
              autoFocus
              className="h-[48px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                }}
                className="flex-1 rounded-xl border border-[#1F1F23] bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !newName.trim()}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkspaceCard({
  workspace,
  onClick,
}: {
  workspace: WorkspaceCard;
  onClick: () => void;
}) {
  const initial = workspace.name.charAt(0).toUpperCase();
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-4 rounded-2xl border border-white/[0.04] bg-[#111318] p-5 text-left hover:border-white/[0.08] transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-sm font-bold text-zinc-400">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold">{workspace.name}</p>
          <p className="text-xs text-zinc-500">
            {workspace._count.members} member
            {workspace._count.members !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </button>
  );
}
