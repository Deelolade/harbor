import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { workspaceService } from "../workspace/workspace.service.js";
import { getSessionUser } from "../../lib/session.js";

export async function searchRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/workspaces/:id/search",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const member = await workspaceService.getMember(id, user.id);
      if (!member) return reply.status(403).send({ message: "Not a member." });

      const { q } = request.query as { q?: string };
      if (!q || q.trim().length < 1) {
        return reply.send({ tasks: [], projects: [], members: [], labels: [] });
      }

      const query = q.trim();

      // Get all project IDs in this workspace
      const projects = await prisma.project.findMany({
        where: { workspaceId: id },
        select: { id: true },
      });
      const projectIds = projects.map((p) => p.id);

      // Get all column IDs in this workspace
      const boards = await prisma.board.findMany({
        where: { projectId: { in: projectIds } },
        select: { id: true },
      });
      const columns = await prisma.column.findMany({
        where: { boardId: { in: boards.map((b) => b.id) } },
        select: { id: true },
      });
      const columnIds = columns.map((c) => c.id);

      const [tasks, matchingProjects, membersList, labels] = await Promise.all([
        prisma.task.findMany({
          where: {
            columnId: { in: columnIds },
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            title: true,
            column: { select: { name: true, board: { select: { projectId: true, project: { select: { name: true } } } } } },
          },
          take: 8,
        }),
        prisma.project.findMany({
          where: { workspaceId: id, name: { contains: query, mode: "insensitive" } },
          select: { id: true, name: true },
          take: 5,
        }),
        prisma.workspaceMember.findMany({
          where: { workspaceId: id },
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        }),
        prisma.taskLabel.findMany({
          where: {
            task: { columnId: { in: columnIds } },
            name: { contains: query, mode: "insensitive" },
          },
          select: { id: true, name: true, color: true, task: { select: { column: { select: { board: { select: { projectId: true } } } } } } },
          distinct: ["name"],
          take: 5,
        }),
      ]);

      const matchingMembers = membersList
        .filter((m) =>
          m.user.name.toLowerCase().includes(query.toLowerCase()) ||
          m.user.email?.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 5)
        .map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
        }));

      return reply.send({
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: `${t.column.board.project.name} / ${t.column.name}`,
          projectId: t.column.board.projectId,
        })),
        projects: matchingProjects.map((p) => ({ id: p.id, name: p.name })),
        members: matchingMembers,
        labels: labels.map((l) => ({
          id: l.id,
          name: l.name,
          color: l.color,
          projectId: l.task.column.board.projectId,
        })),
      });
    },
  );
}
