import fastify from "fastify";

const app = fastify({
  logger: true,
});

app.get("/", async (request, reply) => {
  reply.send("Hello new fastify project sample");
});

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
