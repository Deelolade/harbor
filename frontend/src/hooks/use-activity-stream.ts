import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "../lib/auth-client";

const API_URL = import.meta.env.VITE_API_URL || "";

export function useActivityStream(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  useEffect(() => {
    if (!workspaceId) return;

    const url = `${API_URL}/api/ably/sse?channel=workspace:${workspaceId}:activity`;
    const es = new EventSource(url, { withCredentials: true });

    es.onmessage = (event) => {
      try {
        const activity = JSON.parse(event.data);

        if (activity?.type) {
          queryClient.invalidateQueries({
            queryKey: ["activity", workspaceId],
          });
          queryClient.invalidateQueries({
            queryKey: ["activity-unseen", workspaceId],
          });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });

          if (activity.type === "created_task") {
            const isAssigned = activity.metadata?.assigneeId === currentUserId;
            toast(
              isAssigned
                ? `${activity.actor.name} created "${activity.metadata?.title}" and assigned you to it`
                : `${activity.actor.name} created "${activity.metadata?.title}"`,
              { icon: "📋", duration: 4000 },
            );
          } else if (activity.type === "moved_task") {
            const isMine = activity.metadata?.assigneeId === currentUserId;
            toast(
              isMine
                ? `${activity.actor.name} moved your task "${activity.metadata?.taskTitle || ""}"`
                : `${activity.actor.name} moved a task`,
              { icon: "↗️", duration: 3000 },
            );
          }
        }
      } catch {}
    };

    es.onerror = () => es.close();
    return () => es.close();
  }, [workspaceId, currentUserId, queryClient]);
}
