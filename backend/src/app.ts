import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import compress from "@fastify/compress";
import { COOKIE_SECRET, FRONTEND_URL } from "@/utils/env.js";
import { getAblyToken } from "@/lib/ably.js";
import { auth } from "@/lib/auth.js";
import { authRoutes } from "@/modules/auth/auth.routes.js";
import { workspaceRoutes } from "@/modules/workspace/workspace.routes.js";
import { projectRoutes } from "@/modules/workspace/project.routes.js";
import { boardRoutes } from "@/modules/workspace/board/board.routes.js";
import { columnRoutes } from "@/modules/workspace/board/column.routes.js";
import { taskRoutes } from "@/modules/workspace/task/task.routes.js";
import { subtaskRoutes } from "@/modules/workspace/task/subtask.routes.js";
import { commentRoutes } from "@/modules/workspace/task/comment.routes.js";
import { searchRoutes } from "@/modules/workspace/search.routes.js";
import { activityRoutes } from "@/modules/workspace/task/activity.routes.js";
import { notificationRoutes } from "@/modules/notification/notification.routes.js";
import { PORT } from "@/utils/env.js";
import multipart from "@fastify/multipart";
import { uploadRoutes } from "@/modules/uploads/upload.routes.js";

const fastify = Fastify({ logger: true });

fastify.get("/", async (_request, reply) => {
  reply.send("Hello new fastify project sample");
});

await fastify.register(cookie, { secret: COOKIE_SECRET });

await fastify.register(cors, {
  origin: [FRONTEND_URL, "http://localhost:5173"],
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

// Ably token + SSE proxy
fastify.get("/api/ably/token", async (_request, reply) => {
  const token = await getAblyToken();
  return reply.send({ token: token.token });
});

fastify.get("/api/ably/sse", async (request, reply) => {
  const user = await auth.api.getSession({
    headers: request.headers as HeadersInit,
  });
  if (!user) return reply.status(401).send({ message: "Unauthorized" });

  const { channel: ch } = request.query as { channel?: string };
  if (!ch) return reply.status(400).send({ message: "channel required" });

  const token = await getAblyToken();
  const url = `https://realtime.ably.io/event-stream?accessToken=${token.token}&channels=${ch}&v=1.2`;

  const esRes = await fetch(url);
  if (!esRes.ok) return reply.status(502).send({ message: "Upstream failed" });

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const reader = esRes.body?.getReader();
  if (!reader) return reply.raw.end();

  request.raw.on("close", () => reader.cancel());

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    reply.raw.write(decoder.decode(value));
  }
  reply.raw.end();
});

await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

await fastify.register(workspaceRoutes);
await fastify.register(projectRoutes);
await fastify.register(boardRoutes);
await fastify.register(columnRoutes);
await fastify.register(taskRoutes);
await fastify.register(subtaskRoutes);
await fastify.register(commentRoutes);
await fastify.register(activityRoutes);
await fastify.register(notificationRoutes);
await fastify.register(searchRoutes);
await fastify.register(uploadRoutes, {
  prefix: '/api/v1'
});

fastify.listen(
  {
    port: PORT,
    host: "0.0.0.0",
  },
  (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`Server listening at ${address}`);
  },
);
