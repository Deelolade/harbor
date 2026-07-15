import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../../lib/auth.js";
import { workspaceService } from "../workspace.service.js";
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

export async function boardRoutes(fastify: FastifyInstance) {
  // ── Create board ──
  fastify.post(
    "/api/projects/:id/boards",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });
      const { id } = request.params as { id: string };
      const { name } = request.body as CreateBoardInput;
      if (!name?.trim())
        return reply.status(400).send({ message: "Board name is required." });
      const board = await boardService.create(id, { name: name.trim() });
      return reply.status(201).send(board);
    },
  );

  // ── List boards for a project ──
  fastify.get(
    "/api/projects/:id/boards",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });
      const { id } = request.params as { id: string };
      return reply.send(await boardService.listByProject(id));
    },
  );

  // ── Update board ──
  fastify.put(
    "/api/boards/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });
      const { id } = request.params as { id: string };
      const { name, archived } = request.body as UpdateBoardInput;
      return reply.send(await boardService.update(id, { name, archived }));
    },
  );

  // ── Reorder boards ──
  fastify.put(
    "/api/projects/:id/boards/reorder",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });
      const { boardIds } = request.body as ReorderBoardInput;
      if (!boardIds?.length)
        return reply.status(400).send({ message: "boardIds required." });
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
      await boardService.delete((request.params as { id: string }).id);
      return reply.status(204).send();
    },
  );
}
