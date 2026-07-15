import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { COOKIE_SECRET, FRONTEND_URL } from "./utils/env.js";
import compress from "@fastify/compress";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { workspaceRoutes } from "./modules/workspace/workspace.routes.js";
import { projectRoutes } from "./modules/workspace/project.routes.js";
import { boardRoutes } from "./modules/workspace/board/board.routes.js";
import { columnRoutes } from "./modules/workspace/board/column.routes.js";
import { taskRoutes } from "./modules/workspace/task/task.routes.js";
import { subtaskRoutes } from "./modules/workspace/task/subtask.routes.js";
import { commentRoutes } from "./modules/workspace/task/comment.routes.js";
import { activityRoutes } from "./modules/workspace/task/activity.routes.js";
import { taskRoutes } from "./modules/workspace/task.routes.js";
import { subtaskRoutes } from "./modules/workspace/subtask.routes.js";
import { commentRoutes } from "./modules/workspace/comment.routes.js";
import { activityRoutes } from "./modules/workspace/activity.routes.js";

const fastify = Fastify({ logger: true });
const port = 8800;

fastify.get("/", async (_request, reply) => {
  reply.send("Hello new fastify project sample");
});

await fastify.register(cookie, { secret: COOKIE_SECRET });

await fastify.register(cors, {
  origin: [FRONTEND_URL],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
});

await fastify.register(compress, { global: true, threshold: 1024 });

fastify.route({
  method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  url: "/api/auth/*",
  handler: authRoutes,
});

await fastify.register(workspaceRoutes);
await fastify.register(projectRoutes);
await fastify.register(boardRoutes);
await fastify.register(columnRoutes);
await fastify.register(taskRoutes);
await fastify.register(subtaskRoutes);
await fastify.register(commentRoutes);
await fastify.register(activityRoutes);

fastify.listen({ port }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
