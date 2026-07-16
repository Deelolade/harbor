import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma.js";
import { workspaceService } from "@/modules/workspace/workspace.service.js";
import { activityService } from "@/modules/workspace/task/activity.service.js";
import { getSessionUser } from "@/lib/session.js";

export async function activityRoutes(fastify: FastifyInstance) {
  // ── Activity feed ──
  fastify.get(
    "/api/workspaces/:id/activity",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });
      const { id } = request.params as { id: string };
      const member = await workspaceService.getMember(id, user.id);
      if (!member) return reply.status(403).send({ message: "Not a member." });
      return reply.send(await activityService.listByWorkspace(id, user.id));
    },
  );
}
