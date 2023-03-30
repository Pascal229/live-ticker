"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("@fastify/cors"));
const path_1 = __importDefault(require("path"));
const static_1 = __importDefault(require("@fastify/static"));
const fastify_1 = __importDefault(require("fastify"));
const fastify_2 = require("@trpc/server/adapters/fastify");
const websocket_1 = __importDefault(require("@fastify/websocket"));
const trpc_1 = require("./trpc");
const admin_1 = __importDefault(require("./admin"));
const context_1 = require("./context");
const server = (0, fastify_1.default)();
server.get("/ping", async (_, res) => {
    res.send("pong");
});
//serve static files from client/dist with the get route /
server.register(static_1.default, {
    root: path_1.default.join(__dirname, "..", "..", "client", "dist"),
    prefix: "/",
});
server.register(websocket_1.default);
server.register(fastify_2.fastifyTRPCPlugin, {
    prefix: "/trpc",
    useWSS: true,
    useWss: true,
    trpcOptions: { router: trpc_1.appRouter, createContext: context_1.createContext },
});
server.register(cors_1.default, {
    origin: true,
});
(0, admin_1.default)(server);
(async () => {
    try {
        await server.listen({ port: 3000 });
        console.log(`Server listening on 3000`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
})();
