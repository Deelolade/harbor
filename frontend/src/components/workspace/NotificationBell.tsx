import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiBell,
  FiClipboard,
  FiMessageSquare,
  FiAtSign,
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "";

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  metadata?: any;
  createdAt: string;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () =>
      fetch(`${API_URL}/api/notifications`, { credentials: "include" }).then(
        (r) => r.json(),
      ),
    refetchInterval: 30_000,
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () =>
      fetch(`${API_URL}/api/notifications/unread-count`, {
        credentials: "include",
      }).then((r) => r.json()),
    select: (d: any) => d?.count ?? 0,
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      fetch(`${API_URL}/api/notifications/read-all`, {
        method: "POST",
        credentials: "include",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const icons: Record<string, React.ReactNode> = {
    assignment: <FiClipboard size={16} />,
    comment: <FiMessageSquare size={16} />,
    mention: <FiAtSign size={16} />,
    moved_to_done: <FiCheckCircle size={16} />,
    moved_from_done: <FiRefreshCw size={16} />,
    reassigned: <FiRefreshCw size={16} />,
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-colors"
      >
        <FiBell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-white/[0.06] bg-[#18181B] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-zinc-600">
                  No notifications yet
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markRead.mutate(n.id);
                      if (n.metadata?.taskId) {
                        navigate(
                          `/workspace/${n.metadata.workspaceId}/projects/${n.metadata.projectId}?taskId=${n.metadata.taskId}`,
                        );
                        setOpen(false);
                      }
                    }}
                    className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors ${
                      !n.read ? "bg-blue-500/5" : ""
                    }`}
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-zinc-400">
                      {icons[n.type] || <FiBell size={16} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${!n.read ? "font-semibold text-white" : "text-zinc-400"}`}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[11px] text-zinc-600 mt-1">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
