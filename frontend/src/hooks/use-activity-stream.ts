import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "../lib/auth-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

interface AblyActivity {
  type: string;
  actor: { id: string; name: string; image?: string | null };
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

export function useActivityStream(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  useEffect(() => {
    if (!workspaceId) return;

    let es: EventSource | null = null;

    // Fetch a temporary Ably SSE token from the backend
    fetch(
      `${API_URL}/api/ably/token?channel=workspace:${workspaceId}:activity`,
      {
        credentials: "include",
      },
    )
      .then((r) => r.json())
      .then(({ token }) => {
        const url = `https://realtime.ably.io/event-stream?accessToken=${token}&channels=workspace:${workspaceId}:activity&v=1.2`;
        es = new EventSource(url);

        es.onmessage = (event) => {
          try {
            const activity: AblyActivity = JSON.parse(event.data);
            queryClient.invalidateQueries({
              queryKey: ["activity", workspaceId],
            });
            queryClient.invalidateQueries({
              queryKey: ["activity-unseen", workspaceId],
            });

            if (activity.type === "created_task") {
              toast(
                `${activity.actor.name} created "${activity.metadata?.title}"`,
                { icon: "📋", duration: 4000 },
              );
            } else if (activity.type === "moved_task") {
              const isMyTask =
                activity.metadata?.assigneeId &&
                activity.metadata.assigneeId === currentUserId;
              const message = isMyTask
                ? `${activity.actor.name} moved your task "${activity.metadata?.taskTitle || "Untitled"}"`
                : `${activity.actor.name} moved a task`;
              toast(message, { icon: "↗️", duration: 3000 });
            }
          } catch {}
        };
      })
      .catch(() => {});

    return () => es?.close();
  }, [workspaceId, queryClient]);
}
