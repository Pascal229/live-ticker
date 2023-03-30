import type { FastifyInstance } from "fastify";
import createGame from "./createGame";
import createEvent from "./createEvent";
import createPlayer from "./createPlayer";

const applyRoutes = (group: FastifyInstance) => {
    group.post("/admin/create-game", createGame);

    group.post("/admin/create-event", createEvent);

    group.post("/admin/create-player", createPlayer);
};

export default applyRoutes;
