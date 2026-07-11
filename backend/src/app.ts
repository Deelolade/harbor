import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { COOKIE_SECRET, FRONTEND_URL } from "./utils/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { workspaceRoutes } from "./modules/workspace/workspace.routes.js";

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

fastify.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  handler: authRoutes,
});

await fastify.register(workspaceRoutes);

fastify.listen({ port }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
