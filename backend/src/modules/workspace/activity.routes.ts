import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { workspaceService } from "./workspace.service.js";
import { activityService } from "./activity.service.js";
import { getSessionUser } from "../../lib/session.js";

export async function activityRoutes(fastify: FastifyInstance) {
  // ── Activity feed ──
  fastify.get("/api/workspaces/:id/activity", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { id } = request.params as { id: string };
    const member = await workspaceService.getMember(id, user.id);
    if (!member) return reply.status(403).send({ message: "Not a member." });
    return reply.send(await activityService.listByWorkspace(id));
  });

  // ── Search across tasks, projects, members ──
  fastify.get("/api/workspaces/:id/search", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { id } = request.params as { id: string };
    const member = await workspaceService.getMember(id, user.id);
    if (!member) return reply.status(403).send({ message: "Not a member." });

    const { q } = request.query as { q?: string };
    if (!q || q.trim().length < 2) return reply.send({ tasks: [], projects: [], members: [] });

    const query = q.trim();

    // Get project IDs in this workspace
    const projects = await prisma.project.findMany({
      where: { workspaceId: id },
      select: { id: true },
    });
    const projectIds = projects.map(p => p.id);
    const boards = await prisma.board.findMany({
      where: { projectId: { in: projectIds } },
      select: { id: true },
    });
    const boardIds = boards.map(b => b.id);
    const columns = await prisma.column.findMany({
      where: { boardId: { in: boardIds } },
      select: { id: true },
    });
    const columnIds = columns.map(c => c.id);

    const [tasks, matchingProjects, membersList] = await Promise.all([
      prisma.task.findMany({
        where: {
          columnId: { in: columnIds },
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, column: { select: { name: true, board: { select: { projectId: true } } } } },
        take: 10,
      }),
      prisma.project.findMany({
        where: {
          workspaceId: id,
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true },
        take: 5,
      }),
      prisma.workspaceMember.findMany({
        where: { workspaceId: id },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      }),
    ]);

    const matchingMembers = membersList.filter(
      m => m.user.name.toLowerCase().includes(query.toLowerCase()) || m.user.email?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5).map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email, image: m.user.image }));

    return reply.send({ tasks, projects: matchingProjects, members: matchingMembers });
  });
}
