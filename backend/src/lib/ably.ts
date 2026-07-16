import Ably from "ably";
import { ABLY_API_KEY } from "@/utils/env.js";

export const ably = new Ably.Realtime({ key: ABLY_API_KEY });

export async function getAblyToken() {
  const token = await ably.auth.requestToken({
    capability: { "*": ["subscribe"] },
  });
  return token;
}

export function publishActivity(
  workspaceId: string,
  event: {
    type: string;
    actor: { id: string; name: string; image?: string | null };
    targetType: string;
    targetId?: string;
    metadata?: Record<string, any>;
  },
) {
  const channel = ably.channels.get(`workspace:${workspaceId}:activity`);
  channel.publish("activity", {
    ...event,
    timestamp: new Date().toISOString(),
  });
}
