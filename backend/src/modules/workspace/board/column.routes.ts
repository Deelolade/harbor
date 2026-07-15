import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "@/lib/auth.js";
import { workspaceService } from "@/modules/workspace/workspace.service.js";
import { boardService } from "@/modules/workspace/board/board.service.js";
import { columnService } from "@/modules/workspace/board/column.service.js";
import type {
  CreateColumnInput,
  UpdateColumnInput,
  ReorderColumnInput,
} from "@/modules/workspace/board/column.service.js";

async function getSessionUser(request: FastifyRequest) {
  const session = await auth.api.getSession({
    headers: request.headers as HeadersInit,
  });
  return session?.user ?? null;
}

export async function columnRoutes(fastify: FastifyInstance) {
  // ── Create column ──
  fastify.post(
    "/api/boards/:id/columns",
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

      const { name, color } = request.body as CreateColumnInput;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return reply.status(400).send({ message: "Column name is required." });
      }

      const column = await columnService.create(id, {
        name: name.trim(),
        color,
      });
      return reply.status(201).send(column);
    },
  );

  // ── Update column ──
  fastify.put(
    "/api/columns/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const column = await columnService.getById(id);
      if (!column)
        return reply.status(404).send({ message: "Column not found." });

      const member = await workspaceService.getMember(
        column.board.project.workspaceId,
        user.id,
      );
      if (!member) return reply.status(403).send({ message: "Not a member." });

      const { name, color } = request.body as UpdateColumnInput;
      if (
        name !== undefined &&
        (typeof name !== "string" || name.trim().length === 0)
      ) {
        return reply
          .status(400)
          .send({ message: "Column name cannot be empty." });
      }

      const updated = await columnService.update(id, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(color !== undefined ? { color } : {}),
      });
      return reply.send(updated);
    },
  );

  // ── Reorder columns ──
  fastify.put(
    "/api/boards/:id/columns/reorder",
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

      const { columnIds } = request.body as ReorderColumnInput;
      if (!columnIds || !Array.isArray(columnIds)) {
        return reply
          .status(400)
          .send({ message: "columnIds array is required." });
      }

      await columnService.reorder(columnIds);
      return reply.status(200).send({});
    },
  );

  // ── Delete column ──
  fastify.delete(
    "/api/columns/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const column = await columnService.getById(id);
      if (!column)
        return reply.status(404).send({ message: "Column not found." });

      const member = await workspaceService.getMember(
        column.board.project.workspaceId,
        user.id,
      );
      if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
        return reply
          .status(403)
          .send({ message: "Only admins and owners can delete columns." });
      }

      await columnService.delete(id);
      return reply.status(204).send();
    },
  );
}
