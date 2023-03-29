import type { FastifyInstance } from "fastify";
import db from "../db";
import { z } from "zod";

const createEventObject = z.object({
    type: z.enum(["GOAL", "PENALTY", "PENALTY_KICK", "BREAK", "FINISH"]),
    time: z
        .string()
        .refine((value) => new Date(value))
        .default(new Date().toISOString()),
    game: z.number().refine((value) => ({ connect: { id: value } })),
});

const createGameObject = z
    .object({
        homeTeam: z.string().min(1),
        guestTeam: z.string().min(1),
        players: z
            .array(z.number())
            .min(1)
            .refine((players) => ({
                connect: players.map((player) => ({ id: player })),
            })),
        homeScore: z.number().default(0),
        guestScore: z.number().default(0),
        date: z.string().refine((value) => new Date(value)),
    })
    .strict();

const applyRoutes = (group: FastifyInstance) => {
    group.addHook("onRequest", (req, res) => {
        // TODO: Add auth
        console.log(req);
    });

    group.post("/create-game", async (req, res) => {
        const parsed = createGameObject.safeParse(req.body);
        if (!parsed.success)
            return res.send({ ok: false, error: parsed.error });

        const date = new Date(parsed.data.date);
        if (isNaN(date.getTime()))
            return res.send({ ok: false, error: "date not valid string" });

        db.game.create({
            data: {
                ...parsed.data,
                players: {
                    connect: parsed.data.players.map((player) => ({
                        id: player,
                    })),
                },
                history: [],
            },
        });
    });
};

export default applyRoutes;
