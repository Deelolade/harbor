import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiTrash2, FiX, FiFolder } from "react-icons/fi";
import { toast } from "sonner";
import { authClient } from "../../lib/auth-client";
import { PiFlagPennantDuotone } from "react-icons/pi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string;
  visibility: string;
  createdBy: { id: string; name: string };
  createdAt: string;
}

const visibilityColors: Record<string, string> = {
  PRIVATE: "bg-red-500/10 text-red-400 border-red-500/20",
  WORKSPACE: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  PUBLIC: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

async function fetchProjects(workspaceId: string): Promise<Project[]> {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/projects`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load projects");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function HomeView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const name = session?.user?.name?.split(" ")[0] || "User";

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => fetchProjects(workspaceId!),
    enabled: !!workspaceId,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    image: "📁",
    visibility: "WORKSPACE",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/projects`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProject),
          credentials: "include",
        },
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      setShowCreate(false);
      setNewProject({
        name: "",
        description: "",
        image: "📁",
        visibility: "WORKSPACE",
      });
      toast.success("Project created!");
    },
    onError: (err: any) =>
      toast.error(err?.message || "Failed to create project."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (project: Project) => {
      const res = await fetch(`${API_URL}/api/projects/${project.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      toast.success("Project deleted.");
    },
    onError: (err: any) =>
      toast.error(err?.message || "Failed to delete project."),
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Good morning, {name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in this
            workspace
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          <FiPlus size={15} />
          New project
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FiFolder size={40} className="text-zinc-700 mb-4" />
          <h3 className="text-sm font-semibold text-zinc-400 mb-1">
            No projects yet
          </h3>
          <p className="text-sm text-zinc-600 mb-6">
            Create your first project to get started.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            <FiPlus size={15} />
            Create project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() =>
                navigate(`/workspace/${workspaceId}/projects/${p.id}`)
              }
              className="group relative cursor-pointer rounded-2xl border border-white/[0.04] bg-[#111318] p-5 hover:border-white/[0.08] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{p.image || "📁"}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${p.name}"?`))
                        deleteMutation.mutate(p);
                    }}
                    className="rounded-md p-1.5 text-zinc-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-semibold mb-1 truncate">{p.name}</h3>
              {p.description && (
                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">
                  {p.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase ${visibilityColors[p.visibility] || visibilityColors.WORKSPACE}`}
                >
                  {p.visibility.toLowerCase()}
                </span>
                <span className="text-xs text-zinc-600">
                  by {p.createdBy.name.split(" ")[0].toLocaleLowerCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">New project</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                  Icon
                </label>
                <input
                  value={newProject.image}
                  onChange={(e) =>
                    setNewProject({ ...newProject, image: e.target.value })
                  }
                  className="h-[48px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-2xl text-center placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15"
                  placeholder="📁"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                  Name
                </label>
                <input
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && createMutation.mutate()
                  }
                  autoFocus
                  placeholder="e.g. Mobile App"
                  className="h-[48px] w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                  Description <span className="text-zinc-600">(optional)</span>
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="What's this project about?"
                  className="w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 py-2.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15 resize-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
                  Visibility
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PRIVATE", "WORKSPACE", "PUBLIC"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() =>
                        setNewProject({ ...newProject, visibility: v })
                      }
                      className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                        newProject.visibility === v
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-[#1F1F23] text-zinc-500 hover:border-zinc-700"
                      }`}
                    >
                      {v.charAt(0) + v.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-xl border border-[#1F1F23] px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !newProject.name.trim()}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
              >
                {createMutation.isPending ? "Creating..." : "Create project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
