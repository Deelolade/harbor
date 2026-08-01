import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiPlus,
  FiTrash2,
  FiX,
  FiFolder,
  FiUsers,
  FiLayers,
  FiActivity,
  FiClock,
  FiGrid,
} from "react-icons/fi";
import { toast } from "sonner";
import { authClient } from "../../lib/auth-client";

const API_URL = import.meta.env.VITE_API_URL || "";

// ── Types ──

interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string;
  visibility: string;
  createdBy: { id: string; name: string; image?: string };
  createdAt: string;
  updatedAt: string;
  _count?: { boards: number };
}

interface ActivityItem {
  id: string;
  type: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  actor: { id: string; name: string; image?: string };
}

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; image?: string };
}

// ── Helpers ──

const activityLabels: Record<string, string> = {
  created_task: "created",
  moved_task: "moved",
  updated_task: "updated",
  created_project: "created a project",
  added_member: "joined the workspace",
  changed_role: "changed a role for",
  removed_member: "removed",
  created_comment: "commented on",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Component ──

export default function HomeView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] || "User";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  // ── Data ──

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () =>
      fetch(`${API_URL}/api/workspaces/${workspaceId}/projects`, {
        credentials: "include",
      }).then((r) => (r.ok ? r.json() : [])),
    enabled: !!workspaceId,
    select: (data) => (Array.isArray(data) ? (data as Project[]) : []),
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["members", workspaceId],
    queryFn: () =>
      fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
        credentials: "include",
      }).then((r) => (r.ok ? r.json() : [])),
    enabled: !!workspaceId,
  });

  const { data: activities = [] } = useQuery<ActivityItem[]>({
    queryKey: ["home-activity", workspaceId],
    queryFn: () =>
      fetch(`${API_URL}/api/workspaces/${workspaceId}/activity`, {
        credentials: "include",
      }).then((r) => (r.ok ? r.json() : [])),
    enabled: !!workspaceId,
    refetchInterval: 30_000,
  });

  // ── Create project ──

  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    image: "",
    visibility: "WORKSPACE",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-projects", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      setShowCreate(false);
      setNewProject({ name: "", description: "", image: "", visibility: "WORKSPACE" });
      toast.success("Project created!");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to create project."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (project: Project) => {
      const res = await fetch(`${API_URL}/api/projects/${project.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-projects", workspaceId] });
      toast.success("Project deleted.");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete project."),
  });

  // ── Render ──

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-10">
      {/* ── Welcome ── */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Good {greeting}, {firstName}
          </h1>
          <p className="mt-1.5 text-[15px] text-zinc-500">
            Here's what's happening in your workspace.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98]"
        >
          <FiPlus size={16} />
          New project
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<FiLayers size={18} />}
          value={projects.length}
          label={projects.length === 1 ? "Project" : "Projects"}
          accent="amber"
        />
        <StatCard
          icon={<FiUsers size={18} />}
          value={members.length}
          label={members.length === 1 ? "Member" : "Members"}
          accent="violet"
        />
        <StatCard
          icon={<FiActivity size={18} />}
          value={activities.length}
          label="Recent"
          accent="blue"
        />
      </div>

      {/* ── Main content ── */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Projects */}
        <div>
          <div className="mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Projects
            </h2>
          </div>

          {projectsLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.08] border-t-white" />
            </div>
          ) : projects.length === 0 ? (
            <EmptyProjects onCreate={() => setShowCreate(true)} />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onClick={() => navigate(`/workspace/${workspaceId}/projects/${p.id}`)}
                  onDelete={() => {
                    if (confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <div className="mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Recent Activity
            </h2>
          </div>

          <div className="rounded-2xl border border-white/[0.05] bg-[#111318]">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03]">
                  <FiActivity size={18} className="text-zinc-600" />
                </div>
                <p className="text-[13px] font-medium text-zinc-500">No recent activity</p>
                <p className="mt-1 text-[12px] text-zinc-600 max-w-[200px]">
                  Activity from your team will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activities.slice(0, 5).map((a) => (
                  <ActivityRow key={a.id} activity={a} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Create project modal ── */}
      {showCreate && (
        <CreateProjectModal
          project={newProject}
          onChange={setNewProject}
          onClose={() => setShowCreate(false)}
          onCreate={() => createMutation.mutate()}
          pending={createMutation.isPending}
        />
      )}
    </div>
  );
}

// ── Sub-components ──

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent: "amber" | "violet" | "blue";
}) {
  const accentColors = {
    amber: "bg-amber-500/10 text-amber-400",
    violet: "bg-violet-500/10 text-violet-400",
    blue: "bg-blue-500/10 text-blue-400",
  };

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-[#111318] px-5 py-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-[#13151A]">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${accentColors[accent]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        <p className="text-[12px] font-medium text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onClick,
  onDelete,
}: {
  project: Project;
  onClick: () => void;
  onDelete: () => void;
}) {
  const boardCount = project._count?.boards ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group flex flex-col gap-4 rounded-2xl border border-white/[0.05] bg-[#111318] p-5 text-left transition-all duration-200 hover:border-white/[0.10] hover:bg-[#13151A] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 cursor-pointer"
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] transition-colors group-hover:bg-white/[0.06]">
          {project.image ? (
            <span className="text-xl">{project.image}</span>
          ) : (
            <FiFolder size={20} className="text-zinc-500" />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-lg p-1.5 text-zinc-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
        >
          <FiTrash2 size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-[15px] font-semibold leading-snug">{project.name}</h3>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
            {project.description}
          </p>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-[12px] text-zinc-600">
        <span className="flex items-center gap-1.5">
          <FiGrid size={12} />
          {boardCount} board{boardCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <FiClock size={12} />
          {formatDate(project.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03]">
        <FiFolder size={24} className="text-zinc-600" />
      </div>
      <h3 className="text-[15px] font-semibold text-zinc-300">
        Create your first project
      </h3>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-zinc-600">
        Projects help you organize boards and tasks so your team can ship work faster.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20"
      >
        <FiPlus size={16} />
        Create project
      </button>
    </div>
  );
}

function ActivityRow({ activity: a }: { activity: ActivityItem }) {
  const taskTitle = a.metadata?.title || a.metadata?.taskTitle;
  const verb = activityLabels[a.type] || a.type.replace(/_/g, " ");

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] overflow-hidden">
        {a.actor.image ? (
          <img src={a.actor.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold text-zinc-500">
            {a.actor.name?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-relaxed text-zinc-400">
          <span className="font-medium text-white">{a.actor.name}</span>{" "}
          {verb}
          {taskTitle ? (
            <span className="text-zinc-500"> — {taskTitle}</span>
          ) : null}
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-600">{timeAgo(a.createdAt)} ago</p>
      </div>
    </div>
  );
}

function CreateProjectModal({
  project,
  onChange,
  onClose,
  onCreate,
  pending,
}: {
  project: { name: string; description: string; image: string; visibility: string };
  onChange: (p: typeof project) => void;
  onClose: () => void;
  onCreate: () => void;
  pending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#111318] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">New project</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Name
            </label>
            <input
              value={project.name}
              onChange={(e) => onChange({ ...project, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && onCreate()}
              autoFocus
              placeholder="e.g. Mobile App"
              className="h-12 w-full rounded-xl border border-[#1F1F23] bg-[#0D0E12] px-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/15"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-400 mb-1.5">
              Description <span className="text-zinc-600">(optional)</span>
            </label>
            <textarea
              value={project.description}
              onChange={(e) => onChange({ ...project, description: e.target.value })}
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
                  onClick={() => onChange({ ...project, visibility: v })}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                    project.visibility === v
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
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#1F1F23] px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/[0.04] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={pending || !project.name.trim()}
            className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
          >
            {pending ? "Creating..." : "Create project"}
          </button>
        </div>
      </div>
    </div>
  );
}
