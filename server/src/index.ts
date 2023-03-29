import dotenv from "dotenv";
dotenv.config();

import cors from "@fastify/cors";
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

server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    useWss: true,
    trpcOptions: { router: appRouter, createContext },
});

server.register(ws);
server.register(cors, {
    origin: true,
});

adminRoutes(server);

(async () => {
    try {
        await server.listen({ port: 3000 });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
})();
