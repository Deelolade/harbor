import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { COOKIE_SECRET } from "./utils/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";

const fastify = Fastify({
  logger: true,
});
const port = 8800;

fastify.get("/", async (request, reply) => {
  reply.send("Hello new fastify project sample");
});

// cookie setup
await fastify.register(cookie, {
  secret: COOKIE_SECRET,
});
// cors setup
await fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// route setups
fastify.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  handler: authRoutes,
});

fastify.listen({ port }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
