import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { FiClock, FiMessageSquare, FiMove, FiPlus, FiTrash2, FiEdit, FiUserPlus } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

interface Activity {
  id: string;
  type: string;
  actor: { id: string; name: string; image?: string };
  targetType: string;
  targetId?: string;
  metadata?: any;
  createdAt: string;
}

const icons: Record<string, React.ReactNode> = {
  created_task: <FiPlus size={11} />,
  moved_task: <FiMove size={11} />,
  commented: <FiMessageSquare size={11} />,
  deleted_task: <FiTrash2 size={11} />,
  updated_task: <FiEdit size={11} />,
  added_member: <FiUserPlus size={11} />,
};

const labels: Record<string, string> = {
  created_task: "created a task",
  moved_task: "moved a task",
  commented: "commented on",
  deleted_task: "deleted a task",
  updated_task: "updated a task",
  added_member: "added a member",
};

const colors: Record<string, string> = {
  created_task: "bg-blue-500/10 text-blue-400",
  moved_task: "bg-amber-500/10 text-amber-400",
  commented: "bg-violet-500/10 text-violet-400",
  deleted_task: "bg-red-500/10 text-red-400",
  updated_task: "bg-sky-500/10 text-sky-400",
  added_member: "bg-emerald-500/10 text-emerald-400",
};

function formatTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ActivityFeed() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity", workspaceId],
    queryFn: () => fetch(`${API_URL}/api/workspaces/${workspaceId}/activity`, { credentials: "include" }).then(r => r.json()),
    enabled: !!workspaceId,
    refetchInterval: 15000,
  });

  if (isLoading) return <div className="flex justify-center py-8"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /></div>;

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl font-semibold mb-1">Activity</h1>
      <p className="text-sm text-zinc-500 mb-6">Recent actions across your workspace.</p>

      {activities.length === 0 ? (
        <p className="text-sm text-zinc-600">No activity yet.</p>
      ) : (
        <div className="space-y-1">
          {activities.map((a: Activity) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${colors[a.type] || "bg-zinc-500/10 text-zinc-400"}`}>
                {icons[a.type] || <FiClock size={11} />}
              </div>
              <img src={a.actor.image || ""} className="h-5 w-5 rounded-full bg-white/[0.06]" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-zinc-300">
                  <span className="font-medium text-white">{a.actor.name}</span>{" "}
                  <span className="text-zinc-500">{labels[a.type] || a.type}</span>
                  {a.metadata?.title && <span className="font-medium text-white"> {a.metadata.title}</span>}
                  {a.metadata?.from && a.metadata?.to && (
                    <span className="text-zinc-500"> from <span className="text-zinc-400">{a.metadata.from}</span> to <span className="text-zinc-400">{a.metadata.to}</span></span>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-zinc-600">{formatTime(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
