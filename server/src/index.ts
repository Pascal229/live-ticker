import fastify from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import ws from "@fastify/websocket";
import { appRouter } from "./trpc";
import adminRoutes from "./admin";
import { createContext } from "./context";

const server = fastify();

server.get("/ping", async (request, reply) => {
    return "pong\n";
});

server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: { router: appRouter, createContext },
});
(async () => {
    try {
        await server.listen({ port: 3000 });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
})();

server.register(ws);
server.register(adminRoutes, { prefix: "admin" });

server.listen({ port: 5000 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
