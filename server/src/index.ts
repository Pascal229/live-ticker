import dotenv from "dotenv";
dotenv.config();

import cors from "@fastify/cors";
import path from "path";
import fstatic from "@fastify/static";
import fastify from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import ws from "@fastify/websocket";
import { appRouter } from "./trpc";
import adminRoutes from "./admin";
import { createContext } from "./context";

const server = fastify();

server.get("/ping", async (_, res) => {
  res.send("pong");
});

//serve static files from client/dist with the get route /
server.register(fstatic, {
  root: path.join(__dirname, "..", "..", "client", "dist"),
  prefix: "/",
});

server.register(ws);
server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  useWSS: true,
  useWss: true,
  trpcOptions: { router: appRouter, createContext },
});

server.register(cors, {
  origin: true,
});

adminRoutes(server);

(async () => {
  try {
    await server.listen({ port: 3000 });
    console.log(`Server listening on ${server.server.address()?.toString()}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
})();
