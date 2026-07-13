import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../../lib/auth.js";
import { workspaceService } from "./workspace.service.js";
import { projectService } from "./project.service.js";
import { boardService } from "./board.service.js";
import type {
  CreateBoardInput,
  UpdateBoardInput,
  ReorderBoardInput,
} from "./board.service.js";

async function getSessionUser(request: FastifyRequest) {
  const session = await auth.api.getSession({
    headers: request.headers as HeadersInit,
  });
  return session?.user ?? null;
}

async function requireProjectMember(
  projectId: string,
  userId: string,
  reply: FastifyReply,
) {
  const project = await projectService.getById(projectId);
  if (!project) {
    reply.status(404).send({ message: "Project not found." });
    return null;
  }
  const member = await workspaceService.getMember(project.workspaceId, userId);
  if (!member) {
    reply.status(403).send({ message: "Not a member of this workspace." });
    return null;
  }
  return { project, member };
}

export async function boardRoutes(fastify: FastifyInstance) {
  // ── Create board ──
  fastify.post(
    "/api/projects/:id/boards",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const ctx = await requireProjectMember(id, user.id, reply);
      if (!ctx) return;

      const { name } = request.body as CreateBoardInput;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return reply.status(400).send({ message: "Board name is required." });
      }

      const board = await boardService.create(id, { name: name.trim() });
      return reply.status(201).send(board);
    },
  );

  // ── List project boards ──
  fastify.get(
    "/api/projects/:id/boards",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const ctx = await requireProjectMember(id, user.id, reply);
      if (!ctx) return;

      return reply.send(await boardService.listByProject(id));
    },
  );

  // ── Get board with columns ──
  fastify.get(
    "/api/boards/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const board = await boardService.getById(id);
      if (!board)
        return reply.status(404).send({ message: "Board not found." });

      const member = await workspaceService.getMember(
        board.project.workspaceId,
        user.id,
      );
      if (!member) return reply.status(403).send({ message: "Not a member." });

      return reply.send(board);
    },
  );

  // ── Update board ──
  fastify.put(
    "/api/boards/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const board = await boardService.getById(id);
      if (!board)
        return reply.status(404).send({ message: "Board not found." });

      const member = await workspaceService.getMember(
        board.project.workspaceId,
        user.id,
      );
      if (!member) return reply.status(403).send({ message: "Not a member." });

      const { name, archived } = request.body as UpdateBoardInput;
      if (
        name !== undefined &&
        (typeof name !== "string" || name.trim().length === 0)
      ) {
        return reply
          .status(400)
          .send({ message: "Board name cannot be empty." });
      }

      return reply.send(
        await boardService.update(id, {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(archived !== undefined ? { archived } : {}),
        }),
      );
    },
  );

  // ── Reorder boards ──
  fastify.put(
    "/api/projects/:id/boards/reorder",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const ctx = await requireProjectMember(id, user.id, reply);
      if (!ctx) return;

      const { boardIds } = request.body as ReorderBoardInput;
      if (!boardIds || !Array.isArray(boardIds)) {
        return reply
          .status(400)
          .send({ message: "boardIds array is required." });
      }

      await boardService.reorder(boardIds);
      return reply.status(200).send({});
    },
  );

  // ── Delete board ──
  fastify.delete(
    "/api/boards/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const board = await boardService.getById(id);
      if (!board)
        return reply.status(404).send({ message: "Board not found." });

      const member = await workspaceService.getMember(
        board.project.workspaceId,
        user.id,
      );
      if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
        return reply
          .status(403)
          .send({ message: "Only admins and owners can delete boards." });
      }

      await boardService.delete(id);
      return reply.status(204).send();
    },
  );
}
